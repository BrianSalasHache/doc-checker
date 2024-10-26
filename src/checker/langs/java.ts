import { SyntaxNode } from 'tree-sitter';
import * as vscode from 'vscode';
import { config } from '../../config';
import { BODY, CLASS, JAVADOC, METHOD, MODULE, RETURN, THROW } from '../../constants/constants';
import { createDiagnostic } from '../../utils/diagnostic';

export function analyzeJava(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
    checkModuleJavadoc(rootNode, diagnostics);
    checkClassJavadocs(rootNode, diagnostics);
    checkMethodJavadocs(rootNode, diagnostics);
}

function checkModuleJavadoc(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
    if (config.checkModule) {
        const docstring = extractJavadoc(rootNode, true);
        if (!docstring) {
            diagnostics.push(createDiagnostic(MODULE));
        }
    }
}

function checkClassJavadocs(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
    if (config.checkClass) {
        rootNode.descendantsOfType('class_declaration').forEach((classNode) => {
            validateJavadoc(classNode, CLASS, diagnostics);
        });
    }
}

function checkMethodJavadocs(rootNode: SyntaxNode, diagnostics: vscode.Diagnostic[]) {
    if (config.checkMethod) {
        rootNode.descendantsOfType('method_declaration').forEach((methodNode) => {
            validateJavadoc(methodNode, METHOD, diagnostics);
        });
    }
}

function validateJavadoc(node: SyntaxNode, typeNode: string, diagnostics: vscode.Diagnostic[]) {
    const nameNode = node.childForFieldName('name');
    const bodyNode = node.childForFieldName('body');

    if (!nameNode || !bodyNode) { return; }

    const docstring = extractJavadoc(node);

    if (!docstring) {
        diagnostics.push(createDiagnostic(typeNode, nameNode));
    } else if (typeNode !== CLASS) {
        const updates = requiresJavadocUpdate(node, bodyNode, docstring);
        if (updates) {
            diagnostics.push(createDiagnostic(typeNode, nameNode, updates));
        }
    }
}

function extractJavadoc(node: SyntaxNode, isModule: boolean = false): string {
    let Javadoc = isModule ? node.namedChild(0) : node.previousNamedSibling;

    if (isModule) {
        const nextSibling = node.namedChild(1);
        if (nextSibling && ['class_declaration'].includes(nextSibling.type)) {
            return '';
        }
    }

    if (!Javadoc || Javadoc.type !== 'block_comment') {
        return '';
    }

    const text = Javadoc.text.trim();
    const isValidJavadoc = text.startsWith('/**') && text.endsWith('*/');
    const hasValidContent = text.replace(/\/\*\*\s*|\s*\*\//g, '').trim().length > 8;

    return isValidJavadoc && hasValidContent ? text : '';
}

function requiresJavadocUpdate(node: SyntaxNode, bodyNode: SyntaxNode, docstring: string): (string | string[])[] | null {
    const parameters = extractParameters(node);
    const bodyText = bodyNode ? bodyNode.text : '';

    if (config.checkParameter) {
        const paramUpdates = checkMissingParameters(docstring, parameters);
        if (paramUpdates) { return paramUpdates; }
    }
    if (config.checkThrow) {
        const throwUpdates = checkMissingThrow(docstring, bodyText);
        if (throwUpdates) { return throwUpdates; }
    }
    if (config.checkReturn) {
        const returnUpdates = checkMissingReturn(docstring, bodyText);
        if (returnUpdates) { return returnUpdates; }
    }
    return null;
}

function extractParameters(node: SyntaxNode): string[] {
    const parameterNode = node.childForFieldName('parameters');
    if (parameterNode) {
        return parameterNode.namedChildren.map((child) => {
            const identifierNode = child.namedChildren.find(n => n.type === 'identifier');
            return identifierNode ? identifierNode.text : '';
        }).filter(name => name !== '');
    } else {
        return [];
    }
}

function checkMissingParameters(docstring: string, parameters: string[]): (string | string[])[] | null {
    const documentedParams = new Set(extractDocumentedParameters(docstring));
    const missingParams = new Set<string>();

    parameters.forEach(param => {
        if (!isParameterDocumented(docstring, param)) {
            missingParams.add(param);
        }
        documentedParams.delete(param);
    });

    if (missingParams.size > 0) {
        return [Array.from(missingParams), JAVADOC];
    }
    if (documentedParams.size > 0) {
        return [Array.from(documentedParams), BODY];
    }
    return null;
}

function extractDocumentedParameters(docstring: string): string[] {
    const regex = /@param\s+(\w+)(?:\s+-.*)?/g;
    const documentedParams: string[] = [];
    let match;

    while ((match = regex.exec(docstring)) !== null) {
        documentedParams.push(match[1]);
    }

    return documentedParams;
}

function checkMissingThrow(docstring: string, body: string): string[] | null {
    const hasThrowInBody = body.includes(THROW.toLowerCase());
    const hasThrowInDocstring = docstring.toLowerCase().includes(THROW);

    if (hasThrowInBody && !hasThrowInDocstring) {
        return [THROW, JAVADOC];
    }
    if (!hasThrowInBody && hasThrowInDocstring) {
        return [THROW, BODY];
    }
    return null;
}

function checkMissingReturn(docstring: string, body: string): string[] | null {
    const hasReturnInBody = body.includes(RETURN.toLowerCase());
    const hasReturnInDocstring = docstring.toLowerCase().includes(RETURN);

    if (hasReturnInBody && !hasReturnInDocstring) {
        return [RETURN, JAVADOC];
    }
    if (!hasReturnInBody && hasReturnInDocstring) {
        return [RETURN, BODY];
    }
    return null;
}

function isParameterDocumented(docstring: string, param: string): boolean {
    const paramPattern = new RegExp(`@param\\s+${param}\\b`, 'g');
    return paramPattern.test(docstring);
}