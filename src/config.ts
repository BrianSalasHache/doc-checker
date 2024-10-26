import * as vscode from 'vscode';
import { CLASS, FUNCTION, METHOD, MODULE, PARAMETER, RETURN, THROW } from './constants/constants';

let configuration = vscode.workspace.getConfiguration('doc-checker');

export let config = {
  checkClass: getConfig(CLASS),
  checkFunction: getConfig(FUNCTION),
  checkMethod: getConfig(METHOD),
  checkModule: getConfig(MODULE),
  checkParameter: getConfig(PARAMETER),
  checkThrow: getConfig(THROW),
  checkReturn: getConfig(RETURN),
  activateOnChange: getConfig('activateOnChange'),
  mode: getMode(),
  debounceDelay: getDebounceDelay()
};

function getConfig(property: string): boolean {
  return configuration.get<boolean>(property, true);
}

function getMode() {
  return configuration.get<string>('mode', 'save');
}

function getDebounceDelay() {
  return configuration.get<number>('debounceDelay', 300);
}

function updateConfig() {
  configuration = vscode.workspace.getConfiguration('doc-checker');
  config = {
    checkClass: getConfig(CLASS),
    checkFunction: getConfig(FUNCTION),
    checkMethod: getConfig(METHOD),
    checkModule: getConfig(MODULE),
    checkParameter: getConfig(PARAMETER),
    checkThrow: getConfig(THROW),
    checkReturn: getConfig(RETURN),
    activateOnChange: getConfig('activateOnChange'),
    mode: getMode(),
    debounceDelay: getDebounceDelay()
  };
}

vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('doc-checker')) {
    updateConfig();
  }
});
