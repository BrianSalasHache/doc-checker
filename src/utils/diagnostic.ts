import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';

export function createDiagnostic(
  typeNode: string,
  nameNode: SyntaxNode | null = null,
  updates: (string | string[])[] | null = null
): vscode.Diagnostic {
  const range = createRange(nameNode);
  const diagnostic = new vscode.Diagnostic(
    range,
    createMessage(typeNode, nameNode, updates),
    vscode.DiagnosticSeverity.Warning
  );

  diagnostic.source = 'Doc Checker';

  return diagnostic;
}


function createRange(nameNode: SyntaxNode | null): vscode.Range {
  if (!nameNode) { return createRangeFromCoordinates(0, 0, 0, 0); }
  return createRangeFromCoordinates(
    nameNode.startPosition.row,
    nameNode.startPosition.column,
    nameNode.endPosition.row,
    nameNode.endPosition.column
  );
}

function createRangeFromCoordinates(startRow: number, startColumn: number, endRow: number, endColumn: number): vscode.Range {
  return new vscode.Range(
    new vscode.Position(startRow, startColumn),
    new vscode.Position(endRow, endColumn)
  );
}

function createMessage(typeNode: string, nameNode: SyntaxNode | null = null, updates: (string | string[])[] | null): string {
  if (!nameNode) {
    return `The docstring of the ${typeNode} is missing`;
  } else if (updates) {
    let missing = `'${updates[0]}'`;
    let isAre = 'is';

    if (Array.isArray(updates[0])) {
      const parameter = updates[0].length > 1 ? 'parameters' : 'parameter';
      isAre = updates[0].length > 1 ? 'are' : 'is';
      missing = `${parameter} '${updates[0].join(', ')}'`;
    }


    return `The ${missing} ${isAre} missing in the ${updates[1]} of the '${nameNode.text}' ${typeNode}`;
  }

  return `The docstring of the '${nameNode.text}' ${typeNode} is missing`;
}
