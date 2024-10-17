import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { checkFunction, checkMethod } from '../../config/types';
import { FUNCTION, METHOD } from '../../constants/types';
import { createDiagnostic } from '../../utils/diagnostic';
export function analyzePython(
  rootNode: SyntaxNode,
  diagnostics: vscode.Diagnostic[]
) {
  if (checkFunction || checkMethod) {
    rootNode.descendantsOfType('function_definition').forEach((funcNode) => {
      const parameterNode = funcNode.childForFieldName('parameters');
      const isMethod = parameterNode?.namedChildren[0]?.text === 'self';

      if (isMethod && !checkMethod) {
        return;
      }

      if (!isMethod && !checkFunction) {
        return;
      }

      const type = isMethod ? METHOD : FUNCTION;

      checkPythonDocstring(funcNode, type, diagnostics);
    });
  }
}

function checkPythonDocstring(
  node: SyntaxNode,
  typeNode: string,
  diagnostics: vscode.Diagnostic[]
) {
  const nameNode = node.childForFieldName('name');
  const bodyNode = node.childForFieldName('body');

  if (!nameNode || !bodyNode) {
    return;
  }

  const firstStatement = bodyNode.namedChild(0);
  if (
    !firstStatement ||
    firstStatement.type !== 'expression_statement' ||
    !firstStatement.firstChild ||
    firstStatement.firstChild.type !== 'string'
  ) {
    const diagnostic = createDiagnostic(nameNode, typeNode);
    diagnostics.push(diagnostic);
  }
}
