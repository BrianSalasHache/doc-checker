import * as vscode from 'vscode';
import { updateDiagnostics } from './checker';
import { config } from './config';

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('docstringChecker');
  const supportedLanguages = ['python', 'javascript', 'typescript'];
  const editor = vscode.window.activeTextEditor;
  let debounceTimer: NodeJS.Timeout | null = null;

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
    context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (supportedLanguages.includes(event.document.languageId)) {
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          debounceTimer = setTimeout(() => {
            updateDiagnostics(event.document, diagnosticCollection);
          }, config.debounceDelay);
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
