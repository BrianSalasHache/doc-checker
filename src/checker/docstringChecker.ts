import * as vscode from 'vscode';
import { parseCode } from '../parser/parser';
import { analyzeJava } from './langs/java';
import { analyzeJavaScript } from './langs/javascript';
import { analyzePython } from './langs/python';


interface CacheEntry {
  text: string;
  diagnostics: vscode.Diagnostic[];
  timestamp: number;
}

const diagnosticsCache = new Map<string, CacheEntry>();
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
};

setInterval(cleanCache, 1 * 60 * 1000);


export function analyzeDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const text = document.getText();
  const language = document.languageId;
  const uri = document.uri.toString();
  const currentTime = Date.now();

  const cachedEntry = diagnosticsCache.get(uri);

  if (cachedEntry && cachedEntry.text === text) {
    cachedEntry.timestamp = currentTime;
    return cachedEntry.diagnostics;
  }

  diagnosticsCache.delete(uri);
  const index = cacheKeys.indexOf(uri);
  if (index > -1) {
    cacheKeys.splice(index, 1);
  }

  const tree = parseCode(text, language);
  const { rootNode } = tree;
  const diagnostics: vscode.Diagnostic[] = [];

  switch (language) {
    case 'java':
      analyzeJava(rootNode, diagnostics);
      break;
    case 'javascript':
    case 'typescript':
      analyzeJavaScript(rootNode, diagnostics);
      break;
    case 'python':
      analyzePython(rootNode, diagnostics);
      break;
  }

  diagnosticsCache.set(uri, { text, diagnostics, timestamp: currentTime });
  cacheKeys.push(uri);

  return diagnostics;
}
