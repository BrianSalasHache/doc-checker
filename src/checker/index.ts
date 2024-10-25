import * as vscode from 'vscode';
import { analyzeDocument } from './docstringChecker';



export function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  try {
    const diagnostics = analyzeDocument(document);
    collection.set(document.uri, diagnostics);
  } catch (error) {
    let message: string;

    if (error instanceof Error) {
      message = `Error analyzing document: ${error.message}`;
      console.error(message);
      vscode.window.showErrorMessage(message);
    } else {
      message = `Unexpected error analyzing document: ${error}`;
      console.error(message);
      vscode.window.showWarningMessage(message);
    }
  }
}

