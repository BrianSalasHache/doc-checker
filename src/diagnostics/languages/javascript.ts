import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { createDiagnostic } from '../../utils/positionHelper';

export function analyzeJavaScript(
  rootNode: SyntaxNode,
  diagnostics: vscode.Diagnostic[]
) {
  rootNode.descendantsOfType('function_declaration').forEach((funcNode) => {
    checkJavaScriptDocstring(funcNode, 'function', diagnostics);
  });

  rootNode.descendantsOfType('method_definition').forEach((methodNode) => {
    checkJavaScriptDocstring(methodNode, 'method', diagnostics);
  });
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
      const message = `Falta documentar la ${typeNode} '${nameNode.text}' | Doc Checker`;

      const diagnostic = createDiagnostic(nameNode, message);
      diagnostics.push(diagnostic);
    }
  }
}
