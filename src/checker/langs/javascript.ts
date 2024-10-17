import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { checkFunction, checkMethod } from '../../config/types';
import { FUNCTION, METHOD } from '../../constants/types';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzeJavaScript(
  rootNode: SyntaxNode,
  diagnostics: vscode.Diagnostic[]
) {
  if (checkFunction) {
    rootNode.descendantsOfType('function_declaration').forEach((funcNode) => {
      checkJavaScriptDocstring(funcNode, FUNCTION, diagnostics);
    });
  }

  if (checkMethod) {
    rootNode.descendantsOfType('method_definition').forEach((methodNode) => {
      checkJavaScriptDocstring(methodNode, METHOD, diagnostics);
    });
  }
}

function checkJavaScriptDocstring(
  node: SyntaxNode,
  typeNode: string,
  diagnostics: vscode.Diagnostic[]
) {
  const nameNode = node.childForFieldName('name');

  if (nameNode) {
    const previousSibling = node.previousNamedSibling;
    const hasComment = previousSibling && previousSibling.type === 'comment';

    if (!hasComment) {
      const diagnostic = createDiagnostic(nameNode, typeNode);
      diagnostics.push(diagnostic);
    }
  }
}
