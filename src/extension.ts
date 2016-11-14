'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const fs = require('fs');
import { testHaskellFile } from './testHelper';

export function activate(context: vscode.ExtensionContext) {
    // Init button
    const runButton = vscode.window.createStatusBarItem(1, 0);
    runButton.text = "Run Haskell";
    runButton.command = "editor.runHaskell";
    runButton.show();

    const terminalInput = vscode.window.createStatusBarItem(1, 0);
    terminalInput.text = "Run QuickCheck";
    terminalInput.command = "editor.runQuickCheck";
    terminalInput.show();

    const runHaskell = (src) => {
        const term = vscode.window.createTerminal('Haskell runner');
        term.show();
        term.sendText(`node ${context.extensionPath}/src/runHelper.js run ${src}`);
    };

    const testHaskell = (src) => {
        let counter = -1;
        var done = false;
        const loader = () => {
            let sign;
            counter = (counter + 1) % 4;

            switch (counter) {
                case 0:
                    sign = '|';
                    break;
                case 1:
                    sign = '/';
                    break;
                case 2:
                    sign = '-';
                    break;
                case 3:
                    sign = '\\';
                    break;
                default:
                    break;
            }

            if (!done) setTimeout(loader, 200);
            vscode.window.setStatusBarMessage(`${sign}  Running QuickCheck`, 200);
        }

        loader();
        testHaskellFile(src).then(testResults => {
            done = true;
            const passed = testResults['passedTests'];
            const failed = testResults['failedTests'];

            if (failed.length > 0) {
                if (failed.length === 1) {
                    vscode.window.showErrorMessage(`${failed[0].name} test failed!`);
                }
                else {
                    vscode.window.showErrorMessage(`${failed.length} tests failed!`);
                }
            }
            else if (passed.length > 0) {
                vscode.window.showInformationMessage('All tests passed!');
            }
            else {
                vscode.window.showInformationMessage('No tests were found!');
            }
        }).catch(error => {
            vscode.window.showErrorMessage('VS Code can\'t execute this file. Check the terminal.');
            const errorFilePath = `${context.extensionPath}/errorFile.txt`;
            
            fs.writeFile(errorFilePath, error, 'utf-8', err => {
                const term = vscode.window.createTerminal('Haskell Tests');
                term.sendText(`cat ${errorFilePath}`);
                term.show();
                setTimeout(() => fs.unlinkSync(errorFilePath), 1000);
            });
        });
    };

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runHaskell', editor => {
        vscode.window.setStatusBarMessage('Running your code...', 1000);
        runHaskell(editor.document.uri.path);
    }));

    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runQuickCheck', editor => {
        testHaskell(editor.document.uri.path);
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {
}