import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { FUNCTION, METHOD } from '../../constants/types';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzeJavaScript(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkFunction) {
    rootNode.descendantsOfType('function_declaration').forEach((funcNode) => {
      validateJavaScriptDocstring(funcNode, FUNCTION, diagnostics);
    });
  }

  if (config.checkMethod) {
    rootNode.descendantsOfType('method_definition').forEach((methodNode) => {
      validateJavaScriptDocstring(methodNode, METHOD, diagnostics);
    });
  }
}

function validateJavaScriptDocstring(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
  const nameNode = node.childForFieldName('name');

  if (!nameNode) { return; }

  const docstring = extractJavaScriptComment(node);

  if (!docstring) {
    const diagnostic = createDiagnostic(nameNode, typeNode);
    diagnostics.push(diagnostic);
  } else if (requiresDocstringUpdate(node, docstring)) {
    const diagnostic = createDiagnostic(nameNode, typeNode, true);
    diagnostics.push(diagnostic);
  }
}

function extractJavaScriptComment(node: SyntaxNode): string | null {
  const previousSibling = node.previousNamedSibling;

  if (previousSibling && previousSibling.type === 'comment') {
    return previousSibling.text;
  }

  return null;
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
    (config.checkReturn && checkMissingReturn(docstring, body)) ||
    (config.checkThrow && checkMissingExceptions(docstring, body))
  );
}

function checkMissingParameters(docstring: string, parameters: string[]): boolean {
  return parameters.some((param) => !docstring.includes(param));
}

function checkMissingReturn(docstring: string, body: string): boolean {
  return body.includes('return') && !docstring.includes('return');
}

function checkMissingExceptions(docstring: string, body: string): boolean {
  return body.includes('throw') && !docstring.includes('throws');
}
