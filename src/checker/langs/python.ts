import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { FUNCTION, METHOD } from '../../constants/types';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzePython(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
  if (config.checkFunction || config.checkMethod) {
    rootNode.descendantsOfType('function_definition').forEach((funcNode) => {
      const parameterNode = funcNode.childForFieldName('parameters');
      const isMethod = parameterNode?.namedChildren[0]?.text === 'self';
      const type = isMethod ? METHOD : FUNCTION;

      validateDocstring(funcNode, type, diagnostics);
    });
  }
}

function validateDocstring(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  if (!nameNode || !bodyNode) { return; }

  const firstStatement = bodyNode.namedChild(0);
  const docstring = extractDocstring(firstStatement);

  if (!docstring) {
    const diagnostic = createDiagnostic(nameNode, typeNode);
    diagnostics.push(diagnostic);
  } else if (requiresDocstringUpdate(node, bodyNode, docstring)) {
    const diagnostic = createDiagnostic(nameNode, typeNode, true);
    diagnostics.push(diagnostic);
  }
}

function extractDocstring(statement: SyntaxNode | null): string {
  if (
    statement &&
    statement.type === 'expression_statement' &&
    statement.firstChild &&
    statement.firstChild.type === 'string'
  ) {
    return statement.firstChild.text;
  }
  return '';
}

function requiresDocstringUpdate(node: SyntaxNode, bodyNode: SyntaxNode, docstring: string): boolean {
  const parameterNode = node.childForFieldName('parameters');
  const parameters = parameterNode
    ? parameterNode.namedChildren.map((child) => child.text)
    : [];
  const body = bodyNode.text.toLowerCase();

  return (
    (config.checkParameter && checkMissingParameters(docstring, parameters)) ||
    (config.checkThrow && checkMissingThrow(docstring, body)) ||
    (config.checkReturn && checkMissingReturn(docstring, body))
  );
}

function checkMissingParameters(docstring: string, parameters: string[]): boolean {
  return parameters.some((param) => param !== 'self' && !docstring.includes(param));
}

function checkMissingThrow(docstring: string, body: string): boolean {
  return body.includes('throw') && !docstring.includes('throw');
}

function checkMissingReturn(docstring: string, body: string): boolean {
  return body.includes('return') && !docstring.includes('return');
}
