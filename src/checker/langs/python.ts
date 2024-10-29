import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { BODY, CLASS, DOCSTRING, FUNCTION, METHOD, MODULE, RAISE, RETURN } from '../../constants/constants';
import { createDiagnostic } from '../../utils/diagnostic';

type Parameter = {
    paramName: string;
    paramType?: string;
  }

export function analyzePython(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  checkModuleDocstring(rootNode, diagnostics);
  checkClassDocstrings(rootNode, diagnostics);
  checkFunctionAndMethodDocstrings(rootNode, diagnostics);
}

function checkModuleDocstring(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkModule) {
    const docstring = extractDocstring(rootNode);
    if (!docstring) {
      diagnostics.push(createDiagnostic(MODULE));
    }
  }
}

function checkClassDocstrings(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkClass) {
    rootNode.descendantsOfType('class_definition').forEach((classNode) => {
      validateDocstring(classNode, CLASS, diagnostics);
    });
  }
}

function checkFunctionAndMethodDocstrings(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkFunction || config.checkMethod) {
    rootNode.descendantsOfType('function_definition').forEach((funcNode) => {
      validateFunctionOrMethodDocstring(funcNode, diagnostics);
    });
  }
}

function validateFunctionOrMethodDocstring(funcNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  const parameterNode = funcNode.childForFieldName('parameters');
  const isMethod = parameterNode?.namedChildren[0]?.text === 'self';
  const type = isMethod ? METHOD : FUNCTION;

  if (!shouldCheckDocstring(isMethod)) { return; }

  validateDocstring(funcNode, type, diagnostics);
}

function shouldCheckDocstring(isMethod: boolean): boolean {
  return (config.checkMethod && isMethod) || (config.checkFunction && !isMethod);
}

function validateDocstring(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  if (!nameNode || !bodyNode) { return; }

  const docstring = extractDocstring(bodyNode);
  if (!docstring) {
    diagnostics.push(createDiagnostic(typeNode, nameNode));
  } else if (typeNode !== CLASS) {
    const updates = requiresDocstringUpdate(node, bodyNode, docstring);
    if (updates) {
      diagnostics.push(createDiagnostic(typeNode, nameNode, updates));
    }
  }
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

function extractParameters(node: SyntaxNode): Parameter[] {
  const parameterNode = node.childForFieldName('parameters');
  
  const parameters: Parameter[] = [];
  if (!parameterNode) {
    return parameters;
  }
  parameterNode.namedChildren.map((child) => {
    const paramText = child.text;
    if(paramText.includes(':')){
      const parts = paramText.split(':');
      const paramName = parts[0];
      const paramType = parts[1].trim();
      parameters.push({paramName, paramType} as Parameter);
    } else
    {
      parameters.push({paramName: paramText} as Parameter);
    }
  });

  return parameters;
}

function checkMissingParameters(docstring: string, parameters: Parameter[]): (string | string[])[] | null {
  const style = detectDocstringStyle(docstring);
  const regex = getParameterRegex(style);
  const documentedParams = new Set(extractDocumentedParameters(docstring, style));
  const reservedParameters = new Set(['self', 'cls']);
  const missingParams = new Set<string>();

  parameters.forEach(param => {
    if (!reservedParameters.has(param.paramName) && !isParameterDocumented(docstring, param.paramName, regex)) {
      missingParams.add(param.paramName);
    }
    documentedParams.delete(param.paramName);
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
