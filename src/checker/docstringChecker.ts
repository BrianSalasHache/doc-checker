import * as vscode from 'vscode';
import { parseCode } from '../parser/parser';
import { analyzeJavaScript } from './langs/javascript';
import { analyzePython } from './langs/python';


export interface NodeCacheEntry {
  diagnostic: vscode.Diagnostic | null; // Diagnósticos específicos de este nodo
  text: string; // Texto del nodo para comparación
}

export interface FileCacheEntry {
  diagnostics: vscode.Diagnostic[];
  nodes: Map<string, NodeCacheEntry>; // Mapa de nodos con identificadores únicos como clave
  text: string;
  timestamp: number; // Marca de tiempo del archivo para cambios globales
}

const diagnosticsCache = new Map<string, FileCacheEntry>();
const cacheKeys: string[] = [];
const EXPIRATION_TIME = 15 * 60 * 1000;
const MAX_CACHE_SIZE = 15;

const cleanCache = () => {
  const currentTime = Date.now();

  for (const key of cacheKeys.slice()) {
    const entry = diagnosticsCache.get(key);
    if (entry && currentTime - entry.timestamp > EXPIRATION_TIME) {
      diagnosticsCache.delete(key);
      const index = cacheKeys.indexOf(key);
      if (index > -1) {
        cacheKeys.splice(index, 1);
      }
    }
  }

  while (cacheKeys.length > MAX_CACHE_SIZE) {
    const oldestKey = cacheKeys.shift();
    if (oldestKey) {
      diagnosticsCache.delete(oldestKey);
    }
  }

  // cacheKeys.forEach(key => { console.log('key:', key); });
  // diagnosticsCache.forEach(key => {
  //   key.nodes.forEach(node => {
  //     console.log('node:', node);
  //   });
  // });
};

setInterval(cleanCache, 10 * 1000);

export function analyzeDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const text = document.getText();
  const language = document.languageId;
  const uri = document.uri.toString();
  const currentTime = Date.now();

  let cachedEntry = diagnosticsCache.get(uri);

  if (!cachedEntry) {
    diagnosticsCache.set(uri, { diagnostics: [], nodes: new Map<string, NodeCacheEntry>(), text: text, timestamp: currentTime });
    cachedEntry = diagnosticsCache.get(uri)!;
  } else if (cachedEntry.text === text) {
    cachedEntry.timestamp = currentTime;
    return cachedEntry.diagnostics;
  }

  const index = cacheKeys.indexOf(uri);
  if (index > -1) {
    cacheKeys.splice(index, 1);
  }

  const tree = parseCode(text, language);
  const { rootNode } = tree;
  const diagnostics: vscode.Diagnostic[] = [];

  switch (language) {
    case 'javascript':
    case 'typescript':
      analyzeJavaScript(rootNode, diagnostics);
      break;
    case 'python':
      analyzePython(rootNode, diagnostics, cachedEntry);
      break;
  }

  cachedEntry.nodes.forEach(node => {
    if (node.diagnostic) {
      diagnostics.push(node.diagnostic);
    }
  });
  // diagnosticsCache.set(uri, { text, diagnostics, timestamp: currentTime });
  cacheKeys.push(uri);








  // function logNodeTypes(node: SyntaxNode) {
  //   console.log(`Node type: "${node.type}" is "${node.text}`);

  //   node.children.forEach((childNode) => {
  //     logNodeTypes(childNode); // Recorre cada nodo hijo recursivamente
  //   });
  // }

  // logNodeTypes(rootNode); // Comienza desde la raíz del documento

  return diagnostics;
}
