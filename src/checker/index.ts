import * as vscode from 'vscode';
import { analyzeDocument } from './docstringChecker';

export function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  const diagnostics = analyzeDocument(document);
  collection.set(document.uri, diagnostics);
}
