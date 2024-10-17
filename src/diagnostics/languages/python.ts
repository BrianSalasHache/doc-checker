import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { createDiagnostic } from '../../utils/positionHelper';

export function analyzePython(
  rootNode: SyntaxNode,
  diagnostics: vscode.Diagnostic[]
) {
  rootNode.descendantsOfType('function_definition').forEach((funcNode) => {
    const nameNode = funcNode.childForFieldName('name');
    const bodyNode = funcNode.childForFieldName('body');

    if (nameNode && bodyNode) {
      let isMethod = false;
      let parentNode = funcNode.parent;

      while (parentNode) {
        if (parentNode.type === 'class_definition') {
          isMethod = true;
          break;
        }
        parentNode = parentNode.parent;
      }

      checkPythonDocstring(bodyNode, nameNode, isMethod, diagnostics);
    }
  });
}

function checkPythonDocstring(
  bodyNode: SyntaxNode,
  nameNode: SyntaxNode,
  isMethod: boolean,
  diagnostics: vscode.Diagnostic[]
) {
  const firstStatement = bodyNode.namedChild(0);
  if (
    !firstStatement ||
    firstStatement.type !== 'expression_statement' ||
    !firstStatement.firstChild ||
    firstStatement.firstChild.type !== 'string'
  ) {
    const message = isMethod
      ? `Falta documentar el método '${nameNode.text}' | Doc Checker`
      : `Falta documentar la función '${nameNode.text}' | Doc Checker`;

    const diagnostic = createDiagnostic(nameNode, message);
    diagnostics.push(diagnostic);
  }
}
