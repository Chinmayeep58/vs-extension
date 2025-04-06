// const vscode = require('vscode');
// const axios = require('axios');

// function activate(context) {
//     let disposable = vscode.commands.registerCommand('search-extension.searching', async function () {
//         const query = await vscode.window.showInputBox({ prompt: 'Enter search query' });

//         if (!query) {
//             vscode.window.showWarningMessage('Search query cannot be empty!');
//             return;
//         }

//         // Create a WebView panel to display results inside VS Code
//         const panel = vscode.window.createWebviewPanel(
//             'bingSearchResults',
//             `Search Results for "${query}"`,
//             vscode.ViewColumn.One,
//             { enableScripts: true }
//         );

//         // Fetch search results from the local API
//         try {
//             const response = await axios.get(`http://localhost:3001/search?q=${encodeURIComponent(query)}`);
//             const results = response.data;

//             let htmlContent = `
//                 <html>
//                 <head>
//                     <style>
//                         body { font-family: Arial, sans-serif; padding: 20px; }
//                         h2 { color: #007acc; }
//                         a { text-decoration: none; color: #0066cc; }
//                         .result { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc; }
//                     </style>
//                 </head>
//                 <body>
//                     <h1>Search Results for "${query}"</h1>
//                     ${results.map(result => `
//                         <div class="result">
//                             <h2><a href="#" data-url="${result.link}" class="search-link">${result.title}</a></h2>
//                             <p>${result.description}</p>
//                         </div>
//                     `).join('')}
                    
//                     <script>
//                         document.querySelectorAll('.search-link').forEach(link => {
//                             link.addEventListener('click', (event) => {
//                                 event.preventDefault();
//                                 const url = event.target.getAttribute('data-url');
//                                 window.vscode.postMessage({ command: 'openLink', url: url });
//                             });
//                         });

//                         // Enable communication between WebView and extension
//                         window.vscode = acquireVsCodeApi();
//                     </script>
//                 </body>
//                 </html>
//             `;

//             panel.webview.html = htmlContent;

//             // Handle messages from the WebView
//             panel.webview.onDidReceiveMessage(
//                 message => {
//                     if (message.command === 'openLink') {
//                         panel.webview.html = `<iframe src="${message.url}" width="100%" height="100%" frameborder="0"></iframe>`;
//                     }
//                 },
//                 undefined,
//                 context.subscriptions
//             );

//         } catch (error) {
//             vscode.window.showErrorMessage('Failed to fetch search results. Make sure the server is running!');
//         }
//     });

//     context.subscriptions.push(disposable);
// }

// function deactivate() {}

// module.exports = {
//     activate,
//     deactivate
// };


const vscode = require('vscode');
const axios = require('axios');

function activate(context) {
    let disposable = vscode.commands.registerCommand('search-extension.searching', async function () {
        const query = await vscode.window.showInputBox({ prompt: 'Enter search query' });

        if (!query) {
            vscode.window.showWarningMessage('Search query cannot be empty!');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'bingSearchResults',
            `Search Results for "${query}"`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        try {
            const response = await axios.get(`http://localhost:3001/search?q=${encodeURIComponent(query)}`);
            const results = response.data;

            let htmlContent = `
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2 { color: #007acc; }
                        a { text-decoration: none; color: #0066cc; cursor: pointer; }
                        .result { margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc; }
                    </style>
                </head>
                <body>
                    <h1>Search Results for "${query}"</h1>
                    ${results.map(result => `
                        <div class="result">
                            <h2><a href="#" data-url="${result.link}" class="search-link">${result.title}</a></h2>
                            <p>${result.description}</p>
                        </div>
                    `).join('')}
                    
                    <script>
                        document.querySelectorAll('.search-link').forEach(link => {
                            link.addEventListener('click', (event) => {
                                event.preventDefault();
                                const url = event.target.getAttribute('data-url');
                                window.vscode.postMessage({ command: 'openNewWebview', url: url });
                            });
                        });

                        window.vscode = acquireVsCodeApi();
                    </script>
                </body>
                </html>
            `;

            panel.webview.html = htmlContent;

            panel.webview.onDidReceiveMessage(
                message => {
                    if (message.command === 'openNewWebview') {
                        openLinkInNewWebView(context, message.url);
                    }
                },
                undefined,
                context.subscriptions
            );

        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch search results. Make sure the server is running!');
        }
    });

    context.subscriptions.push(disposable);
}

function openLinkInNewWebView(context, url) {
    const newPanel = vscode.window.createWebviewPanel(
        'webViewLink',
        'Opened Page',
        vscode.ViewColumn.One,
        { enableScripts: true }
    );

    newPanel.webview.html = `
        <html>
        <head>
            <style>
                body, iframe { margin: 0; padding: 0; width: 100%; height: 100vh; border: none; }
            </style>
        </head>
        <body>
            <iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>
        </body>
        </html>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
