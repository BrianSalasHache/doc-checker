import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { BODY, CLASS, FUNCTION, JSDOC, METHOD, MODULE, RETURN, THROW } from '../../constants/constants';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzeJavaScript(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  checkModuleJSDoc(rootNode, diagnostics);
  checkClassJSDocs(rootNode, diagnostics);
  checkFunctionJSDocs(rootNode, diagnostics);
  checkMethodJSDocs(rootNode, diagnostics);
}

function checkModuleJSDoc(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkModule) {
    const docstring = extractJSDoc(rootNode, true);
    if (!docstring) {
      diagnostics.push(createDiagnostic(MODULE));
    }
  }
}

function checkClassJSDocs(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkClass) {
    rootNode.descendantsOfType('class_declaration').forEach((classNode) => {
      validateJSDoc(classNode, CLASS, diagnostics);
    });
  }
}

function checkFunctionJSDocs(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkFunction) {
    rootNode.descendantsOfType('function_declaration').forEach((funcNode) => {
      validateJSDoc(funcNode, FUNCTION, diagnostics);
    });
  }
}

function checkMethodJSDocs(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkMethod) {
    rootNode.descendantsOfType('method_definition').forEach((methodNode) => {
      validateJSDoc(methodNode, METHOD, diagnostics);
    });
  }
}

function validateJSDoc(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  if (!nameNode || !bodyNode) { return; }

  const docstring = extractJSDoc(node);

  if (!docstring) {
    diagnostics.push(createDiagnostic(typeNode, nameNode));
  } else if (typeNode !== CLASS) {
    const updates = requiresJSDocUpdate(node, bodyNode, docstring);
    if (updates) {
      diagnostics.push(createDiagnostic(typeNode, nameNode, updates));
    }
  }
}

function extractJSDoc(node: SyntaxNode, isModule: boolean = false): string {
  let JSDoc = isModule ? node.namedChild(0) : node.previousNamedSibling;
  if (isModule) {
    const nextSibling = node.namedChild(1);
    if (nextSibling && ['class_declaration', 'function_declaration'].includes(nextSibling.type)) {
      return '';
    }
  }

  if (!JSDoc || JSDoc.type !== 'comment') {
    return '';
  }

  const text = JSDoc.text.trim();
  const isValidJsDoc = text.startsWith('/**') && text.endsWith('*/');
  const hasValidContent = text.replace(/\/\*\*\s*|\s*\*\//g, '').trim().length > 8;

  return isValidJsDoc && hasValidContent ? text : '';
}

function requiresJSDocUpdate(node: SyntaxNode, bodyNode: SyntaxNode, docstring: string): (string | string[])[] | null {
  const parameters = extractParameters(node);
  const bodyText = bodyNode ? bodyNode.text : '';

  if (config.checkParameter) {
    const paramUpdates = checkMissingParameters(docstring, parameters);
    if (paramUpdates) { return paramUpdates; }
  }
  if (config.checkThrow) {
    const throwUpdates = checkMissingThrow(docstring, bodyText);
    if (throwUpdates) { return throwUpdates; }
  }
  if (config.checkReturn) {
    const returnUpdates = checkMissingReturn(docstring, bodyText);
    if (returnUpdates) { return returnUpdates; }
  }
  return null;
}

function extractParameters(node: SyntaxNode): string[] {
  const parameterNode = node.childForFieldName('parameters');
  return parameterNode ? parameterNode.namedChildren.map((child) => child.text) : [];
}

function checkMissingParameters(docstring: string, parameters: string[]): (string | string[])[] | null {
  const documentedParams = new Set(extractDocumentedParameters(docstring));
  const missingParams = new Set<string>();

  parameters.forEach(param => {
    if (!isParameterDocumented(docstring, param)) {
      missingParams.add(param);
    }
    documentedParams.delete(param);
  });

  if (missingParams.size > 0) {
    return [Array.from(missingParams), JSDOC];
  }
  if (documentedParams.size > 0) {
    return [Array.from(documentedParams), BODY];
  }
  return null;
}

function extractDocumentedParameters(docstring: string): string[] {
  const regex = /@(?:param|arg|argument)(?:\s+\{[^}]+\}\s+|\s+)(\w+)(?:\s*-.*)?/g;
  const documentedParams: string[] = [];
  let match;

  while ((match = regex.exec(docstring)) !== null) {
    documentedParams.push(match[1]);
  }

  return documentedParams;
}

function checkMissingThrow(docstring: string, body: string): string[] | null {
  const hasThrowInBody = body.includes(THROW.toLowerCase());
  const hasThrowInDocstring = docstring.toLowerCase().includes(THROW);

  if (hasThrowInBody && !hasThrowInDocstring) {
    return [THROW, JSDOC];
  }
  if (!hasThrowInBody && hasThrowInDocstring) {
    return [THROW, BODY];
  }
  return null;
}

function checkMissingReturn(docstring: string, body: string): string[] | null {
  const hasReturnInBody = body.includes(RETURN.toLowerCase());
  const hasReturnInDocstring = docstring.toLowerCase().includes(RETURN);

  if (hasReturnInBody && !hasReturnInDocstring) {
    return [RETURN, JSDOC];
  }
  if (!hasReturnInBody && hasReturnInDocstring) {
    return [RETURN, BODY];
  }
  return null;
}

function isParameterDocumented(docstring: string, param: string): boolean {
  const paramPattern = new RegExp(`@(?:param|arg|argument)(?:\\s+\\{[^}]+\\}\\s+|\\s+)${param}\\b`, 'g');
  return paramPattern.test(docstring);
}