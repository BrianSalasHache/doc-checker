import * as vscode from 'vscode';
import { parseCode } from '../parser/parser';
import { analyzeJavaScript } from './langs/javascript';
import { analyzePython } from './langs/python';

export function analyzeDocument(
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const text = document.getText();
  const language = document.languageId;

  const tree = parseCode(text, language);
  const { rootNode } = tree;
  const diagnostics: vscode.Diagnostic[] = [];

  switch (language) {
    case 'javascript':
      analyzeJavaScript(rootNode, diagnostics);
      break;
    case 'python':
      analyzePython(rootNode, diagnostics);
      break;
    case 'typescript':
      analyzeJavaScript(rootNode, diagnostics);
      break;
  }

  // function logNodeTypes(node: SyntaxNode) {
  //   console.log(`Node type: "${node.type}" is "${node.text}`);

  //   node.children.forEach((childNode) => {
  //     logNodeTypes(childNode); // Recorre cada nodo hijo recursivamente
  //   });
  // }

  // logNodeTypes(rootNode); // Comienza desde la raíz del documento

  return diagnostics;
}
