import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { BODY, CLASS, DOCSTRING, FUNCTION, METHOD, MODULE, RAISE, RETURN } from '../../constants/constants';
import { createDiagnostic } from '../../utils/diagnostic';
import { FileCacheEntry } from '../docstringChecker';

export function analyzePython(
  rootNode: SyntaxNode,
  diagnostics: vscode.Diagnostic[],
  cachedEntry: FileCacheEntry
) {
  console.log("Se ejecuta analyzePython");
  checkModuleDocstring(rootNode, diagnostics, cachedEntry);
  checkClassDocstrings(rootNode, diagnostics, cachedEntry);
  checkFunctionAndMethodDocstrings(rootNode, diagnostics, cachedEntry);

  cachedEntry.timestamp = Date.now();
}

function checkModuleDocstring(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[], cachedEntry: FileCacheEntry) {
  if (config.checkModule) {
    const cachedNode = cachedEntry.nodes.get(rootNode.type);
    const docstring = extractDocstring(rootNode);
    if (cachedNode && cachedNode.text === docstring) {
      console.log("se reutiliza el módulo", docstring);
      return;
    }

    let diagnostic: vscode.Diagnostic | null = null;

    if (!docstring) {
      diagnostic = createDiagnostic(MODULE);
    }

    console.log("se setea el módulo", docstring);
    cachedEntry.nodes.set(rootNode.type, { text: docstring, diagnostic: diagnostic });
  }
}

function checkClassDocstrings(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[], cachedEntry: FileCacheEntry) {
  if (config.checkClass) {
    rootNode.descendantsOfType('class_definition').forEach((classNode, index) => {
      const nodeId = `${classNode.type}_${index}`;
      validateDocstring(classNode, CLASS, diagnostics, cachedEntry, nodeId);
    });
  }
}

function checkFunctionAndMethodDocstrings(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[], cachedEntry: FileCacheEntry) {
  if (config.checkFunction || config.checkMethod) {
    rootNode.descendantsOfType('function_definition').forEach((funcNode, index) => {
      const nodeId = `${funcNode.type}_${index}`;
      validateFunctionOrMethodDocstring(funcNode, diagnostics, cachedEntry, nodeId);
    });
  }
}

function validateFunctionOrMethodDocstring(funcNode: SyntaxNode, diagnostics: vscode.Diagnostic[], cachedEntry: FileCacheEntry, nodeId: string) {
  const parameterNode = funcNode.childForFieldName('parameters');
  const isMethod = parameterNode?.namedChildren[0]?.text === 'self';
  const type = isMethod ? METHOD : FUNCTION;

  if (!shouldCheckDocstring(isMethod)) { return; }

  validateDocstring(funcNode, type, diagnostics, cachedEntry, nodeId);
}

function shouldCheckDocstring(isMethod: boolean): boolean {
  return (config.checkMethod && isMethod) || (config.checkFunction && !isMethod);
}

function validateDocstring(
  node: SyntaxNode,
  typeNode: string,
  diagnostics: vscode.Diagnostic[],
  cachedEntry: FileCacheEntry,
  nodeId: string
) {
  const cachedNode = cachedEntry.nodes.get(nodeId);
  if (cachedNode && cachedNode.text === node.text) {
    console.log(`se reutiliza el ${typeNode} "${cachedNode.text}"`);
    return;
  }

  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  if (!nameNode || !bodyNode) { return; }

  const docstring = extractDocstring(bodyNode);
  let diagnostic: vscode.Diagnostic | null = null;

  if (!docstring) {
    diagnostic = createDiagnostic(typeNode, nameNode);
  } else if (typeNode !== CLASS) {
    const updates = requiresDocstringUpdate(node, bodyNode, docstring);
    if (updates) {
      diagnostic = createDiagnostic(typeNode, nameNode, updates);
    }
  }

  console.log(`se setea el ${typeNode} "${node.text}"`);
  console.log(`Porque antes era "${cachedNode?.text}"`);
  cachedEntry.nodes.set(nodeId, { text: node.text, diagnostic: diagnostic });
}

function extractDocstring(node: SyntaxNode): string {
  const docstring = node.namedChild(0);
  if (!docstring || !docstring.text.trim()) { return ''; }

  const text = docstring.text.trim();
  const tripleQuotedPattern = /^("""|''')([\s\S]*?)\1$/;
  const hasValidContent = text.replace(/"""|'''/g, '').trim().length > 8;

  return tripleQuotedPattern.test(text) && hasValidContent ? text : '';
}

function requiresDocstringUpdate(node: SyntaxNode, bodyNode: SyntaxNode, docstring: string): (string | string[])[] | null {
  const parameters = extractParameters(node);
  const bodyText = bodyNode.text;
  const docstringPattern = /(['"]{3})([\s\S]*?)\1/g;
  const cleanedBodyText = bodyText.replace(docstringPattern, '').trim();

  if (config.checkParameter) {
    const paramUpdates = checkMissingParameters(docstring, parameters);
    if (paramUpdates) { return paramUpdates; }
  }
  if (config.checkThrow) {
    const raiseUpdates = checkMissingRaise(docstring, cleanedBodyText);
    if (raiseUpdates) { return raiseUpdates; }
  }
  if (config.checkReturn) {
    const returnUpdates = checkMissingReturn(docstring, cleanedBodyText);
    if (returnUpdates) { return returnUpdates; }

  }
  return null;
}

function extractParameters(node: SyntaxNode): string[] {
  const parameterNode = node.childForFieldName('parameters');
  return parameterNode ? parameterNode.namedChildren.map((child) => child.text) : [];
}

function checkMissingParameters(docstring: string, parameters: string[]): (string | string[])[] | null {
  const style = detectDocstringStyle(docstring);
  const regex = getParameterRegex(style);
  const documentedParams = new Set(extractDocumentedParameters(docstring, style));
  const reservedParameters = new Set(['self', 'cls']);
  const missingParams = new Set<string>();

  parameters.forEach(param => {
    if (!reservedParameters.has(param) && !isParameterDocumented(docstring, param, regex)) {
      missingParams.add(param);
    }
    documentedParams.delete(param);
  });

  if (missingParams.size > 0) {
    return [Array.from(missingParams), DOCSTRING];
  }
  if (documentedParams.size > 0) {
    return [Array.from(documentedParams), BODY];
  }
  return null;
}

function getParameterRegex(style: string): (param: string) => string {
  const styles: { [key: string]: (param: string) => string } = {
    google: (param) => `\\b${param}\\s*\\([^\\)]+\\):`,
    numpy: (param) => `\\b${param}\\s*:\\s*\\w+`,
    reST: (param) => `:param\\s+${param}:`
  };
  return styles[style];
}

function extractDocumentedParameters(docstring: string, style: string): string[] {
  const regex = getDocumentedParamRegex(style);
  const documentedParams: string[] = [];
  let match;

  while ((match = regex.exec(docstring)) !== null) {
    documentedParams.push(match[1]);
  }

  return documentedParams;
}

function getDocumentedParamRegex(style: string): RegExp {
  const styles: { [key: string]: RegExp } = {
    google: /\b(\w+)\s*\([^)]*\):/g,
    numpy: /\b(\w+)\s*:\s*\w+/g,
    reST: /:param\s+(\w+):/g
  };
  return styles[style];
}

function checkMissingRaise(docstring: string, body: string): string[] | null {
  const hasRaiseInBody = body.includes(RAISE);
  const hasRaiseInDocstring = docstring.toLowerCase().includes(RAISE);

  if (hasRaiseInBody && !hasRaiseInDocstring) {
    return [RAISE, DOCSTRING];
  }
  if (!hasRaiseInBody && hasRaiseInDocstring) {
    return [RAISE, BODY];
  }
  return null;
}

function checkMissingReturn(docstring: string, body: string): string[] | null {
  const hasReturnInBody = body.includes(RETURN);
  const hasReturnInDocstring = docstring.toLowerCase().includes(RETURN);

  if (hasReturnInBody && !hasReturnInDocstring) {
    return [RETURN, DOCSTRING];
  }
  if (!hasReturnInBody && hasReturnInDocstring) {
    return [RETURN, BODY];
  }
  return null;
}

function detectDocstringStyle(docstring: string): string {
  if (docstring.includes('Args:')) { return 'google'; }
  if (docstring.includes('Parameters')) { return 'numpy'; }
  return 'reST';
}

function isParameterDocumented(docstring: string, param: string, regexFn: (param: string) => string): boolean {
  return new RegExp(regexFn(param), 'i').test(docstring);
}
