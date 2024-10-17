import * as vscode from 'vscode';
import { parseCode } from '../parser/parser';
import { analyzeJavaScript } from './languages/javascript';
import { analyzePython } from './languages/python';

export function analyzeDocument(
  document: vscode.TextDocument
): vscode.Diagnostic[] {
  const text = document.getText();
  const language = document.languageId;

  const tree = parseCode(text, language);
  const rootNode = tree.rootNode;
  const diagnostics: vscode.Diagnostic[] = [];

  if (document.languageId === 'python') {
    analyzePython(rootNode, diagnostics);
  } else if (document.languageId === 'javascript') {
    analyzeJavaScript(rootNode, diagnostics);
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
