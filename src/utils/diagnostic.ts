import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';

export function createDiagnostic(
  nameNode: SyntaxNode,
  typeNode: string,
  isOutdated: boolean = false
): vscode.Diagnostic {
  return new vscode.Diagnostic(
    createRange(
      nameNode.startPosition.row,
      nameNode.startPosition.column,
      nameNode.endPosition.row,
      nameNode.endPosition.column
    ),
    createMessage(nameNode, typeNode, isOutdated),
    vscode.DiagnosticSeverity.Warning
  );
}

function createRange(
  startRow: number,
  startColumn: number,
  endRow: number,
  endColumn: number
): vscode.Range {
  return new vscode.Range(
    new vscode.Position(startRow, startColumn),
    new vscode.Position(endRow, endColumn)
  );
}

function createMessage(nameNode: SyntaxNode, typeNode: string, isOutdated: boolean): string {
  return `${isOutdated ? 'Outdated' : 'Missing'} ${typeNode} docstring '${nameNode.text}' | Doc Checker`;
}
