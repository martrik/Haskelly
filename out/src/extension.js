'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const utils_1 = require('./helpers/utils');
const testCode_1 = require('./helpers/testCode');
const completionProvider_1 = require('./helpers/completionProvider');
function loadGHCi(extPath, src) {
    const term = vscode.window.createTerminal('Haskell GHCi');
    term.show();
    term.sendText(`node ${extPath}/src/helpers/runCode.js ghci ${src}`);
}
function runHaskell(extPath, src) {
    const term = vscode.window.createTerminal('Haskell Run');
    term.show();
    term.sendText(`stack runhaskell ${src}`);
}
function showTestOutput(passed, failed) {
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
        vscode.window.showErrorMessage('No tests were found!');
    }
}
function showTestError(error, extPath) {
    vscode.window.showErrorMessage('VS Code can\'t execute this file. Check the terminal.');
    const errorFilePath = `${extPath}/${utils_1.guid()}.txt`;
    fs.writeFile(errorFilePath, error, 'utf-8', err => {
        const term = vscode.window.createTerminal('Haskell Tests');
        term.sendText(`cat ${errorFilePath}`);
        term.show();
        setTimeout(() => fs.unlinkSync(errorFilePath), 1000);
    });
}
function stackBuild(extPath, src) {
    const term = vscode.window.createTerminal('Haskell Run');
    term.show();
    term.sendText(`node ${extPath}/src/helpers/runCode.js build ${src}`);
}
function testHaskell(extPath, src) {
    let counter = -1;
    let doneTesting = false;
    const loader = () => {
        counter = (counter + 1) % 4;
        const sign = ['|', '/', '-', '\\'][counter];
        if (!doneTesting)
            setTimeout(loader, 200);
        vscode.window.setStatusBarMessage(`${sign}  Running QuickCheck`, 200);
    };
    loader();
    testCode_1.testHaskellFile(src).then(testResults => {
        doneTesting = true;
        showTestOutput(testResults['passedTests'], testResults['failedTests']);
    }).catch(error => {
        doneTesting = true;
        showTestError(error, extPath);
    });
}
function createButtons(context, buttons) {
    for (let i = 0; i < buttons.length; i++) {
        const button = vscode.window.createStatusBarItem(1, 0);
        button.text = buttons[i][0];
        button.command = buttons[i][1];
        button.show();
    }
}
function activate(context) {
    createButtons(context, [['Load GHCi', 'editor.ghci'], ['Run file', 'editor.runHaskell'],
        ['Stack build', 'editor.stackBuild'], ['QuickCheck', 'editor.runQuickCheck']]);
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.ghci', editor => {
        vscode.window.setStatusBarMessage('Loading module in GHCi...', 1000);
        loadGHCi(context.extensionPath, editor.document.uri.path);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runHaskell', editor => {
        vscode.window.setStatusBarMessage('Running your code...', 1000);
        runHaskell(context.extensionPath, editor.document.uri.path);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.stackBuild', editor => {
        stackBuild(context.extensionPath, editor.document.uri.path);
    }));
    context.subscriptions.push(vscode.commands.registerTextEditorCommand('editor.runQuickCheck', editor => {
        testHaskell(context.extensionPath, editor.document.uri.path);
    }));
    const sel = 'haskell';
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(sel, new completionProvider_1.default(), '.', '\"'));
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map