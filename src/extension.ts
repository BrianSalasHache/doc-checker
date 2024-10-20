import * as vscode from 'vscode';
import { updateDiagnostics } from './checker';

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection('docstringChecker');

  if (vscode.window.activeTextEditor) {
    updateDiagnostics(
      vscode.window.activeTextEditor.document,
      diagnosticCollection
    );
  }

  const supportedLanguages = ['python', 'javascript', 'typescript'];

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor && supportedLanguages.includes(editor.document.languageId)) {
        updateDiagnostics(editor.document, diagnosticCollection);
      }
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (supportedLanguages.includes(event.document.languageId)) {
        updateDiagnostics(event.document, diagnosticCollection);
      }
    })
  );
}

export function deactivate() { }
