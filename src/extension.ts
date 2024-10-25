import * as vscode from 'vscode';
import { updateDiagnostics } from './checker';
import { config } from './config';

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('docstringChecker');
  const supportedLanguages = ['python', 'javascript', 'typescript'];

  // TODO: Algunos se ejecutan varias veces sobre todo el modify creo
  const editor = vscode.window.activeTextEditor;

  if (editor && supportedLanguages.includes(editor.document.languageId)) {
    updateDiagnostics(editor.document, diagnosticCollection);
  }

  if (config.activateOnChange) {
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor && supportedLanguages.includes(editor.document.languageId)) {
          updateDiagnostics(editor.document, diagnosticCollection);
        }
      }),
    );
  }

  if (config.mode === 'modify') {
    // TODO: Wait time before executing
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (supportedLanguages.includes(event.document.languageId)) {
          updateDiagnostics(event.document, diagnosticCollection);
        }
      }),
    );
  } else if (config.mode === 'save') {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        if (supportedLanguages.includes(document.languageId)) {
          updateDiagnostics(document, diagnosticCollection);
        }
      }),
    );
  }

  vscode.window.showInformationMessage('Doc Checker activated correctly.');
}

export function deactivate() { }
