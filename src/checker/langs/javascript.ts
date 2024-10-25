import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { CLASS, FUNCTION, METHOD, MODULE, RETURN, THROW } from '../../constants/constants';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzeJavaScript(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkModule) {
    const docstring = extractJSDoc(rootNode, config.checkModule);
    if (!docstring) {
      const diagnostic = createDiagnostic(MODULE);
      diagnostics.push(diagnostic);
    }
  }

  if (config.checkClass) {
    rootNode.descendantsOfType('class_declaration').forEach((classNode) => {
      validateJSDoc(classNode, CLASS, diagnostics);
    });
  }

  if (config.checkFunction) {
    rootNode.descendantsOfType('function_declaration').forEach((funcNode) => {
      validateJSDoc(funcNode, FUNCTION, diagnostics);
    });
  }

  if (config.checkMethod) {
    rootNode.descendantsOfType('method_definition').forEach((methodNode) => {
      validateJSDoc(methodNode, METHOD, diagnostics);
    });
  }
}

function validateJSDoc(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
  const nameNode = node.childForFieldName('name');

  if (!nameNode) { return; }

  const docstring = extractJSDoc(node);

  if (!docstring) {
    const diagnostic = createDiagnostic(typeNode, nameNode);
    diagnostics.push(diagnostic);
  } else if (typeNode !== CLASS && requiresDocstringUpdate(node, docstring)) {
    const diagnostic = createDiagnostic(typeNode, nameNode, true);
    diagnostics.push(diagnostic);
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

  if (isValidJsDoc && hasValidContent) {
    return text;
  }

  return '';
}

function requiresDocstringUpdate(node: SyntaxNode, docstring: string): boolean {
  const parameterNode = node.childForFieldName('parameters');
  const parameters = parameterNode
    ? parameterNode.namedChildren.map((child) => child.text)
    : [];
  const bodyNode = node.childForFieldName('body');
  const body = bodyNode ? bodyNode.text.toLowerCase() : '';

  return (
    (config.checkParameter && checkMissingParameters(docstring, parameters)) ||
    (config.checkThrow && checkMissingThrow(docstring, body)) ||
    (config.checkReturn && checkMissingReturn(docstring, body))
  );
}

function checkMissingParameters(docstring: string, parameters: string[]): boolean {
  return parameters.some((param) => !isParameterDocumented(docstring, param));
}

function checkMissingThrow(docstring: string, body: string): boolean {
  return body.includes(THROW) && !docstring.includes(THROW);
}

function checkMissingReturn(docstring: string, body: string): boolean {
  return body.includes(RETURN) && !docstring.includes(RETURN);
}

function isParameterDocumented(docstring: string, param: string): boolean {
  const paramPattern = new RegExp(`@param\\s+\\{[^}]+\\}\\s+${param}\\b`, 'g');
  return paramPattern.test(docstring);
}
