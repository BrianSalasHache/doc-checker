import * as vscode from 'vscode';

let configuration = vscode.workspace.getConfiguration('doc-checker');

export let config = {
  checkClass: getConfig('class'),
  checkFunction: getConfig('function'),
  checkMethod: getConfig('method'),
  checkModule: getConfig('module'),
  checkParameter: getConfig('parameter'),
  checkThrow: getConfig('throw'),
  checkReturn: getConfig('return'),
};

function getConfig(property: string): boolean {
  return configuration.get<boolean>(property, true);
}

function updateConfig() {
  configuration = vscode.workspace.getConfiguration('doc-checker');
  config = {
    checkClass: getConfig('class'),
    checkFunction: getConfig('function'),
    checkMethod: getConfig('method'),
    checkModule: getConfig('module'),
    checkParameter: getConfig('parameter'),
    checkThrow: getConfig('throw'),
    checkReturn: getConfig('return'),
  };
}

vscode.workspace.onDidChangeConfiguration((e) => {
  if (e.affectsConfiguration('doc-checker')) {
    updateConfig();
  }
});
