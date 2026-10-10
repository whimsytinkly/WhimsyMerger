const filePicker =
    document.querySelector("#file-picker");

const folderPicker =
    document.querySelector("#folder-picker");

const mergeFileList =
    document.querySelector("#merge-file-list");

const ignoredFileList =
    document.querySelector("#ignored-file-list");

const conflictError =
    document.querySelector("#conflict-error");

const conflictFileList =
    document.querySelector("#conflict-file-list");

async function updateFilePreview() {

    const files =
        await getSelectedFiles();

    mergeFileList.innerHTML = "";
    ignoredFileList.innerHTML = "";


    const htmlFiles = [];

    const cssFiles = [];

    const jsFiles = [];


    // ================================
    // Classify Files
    // ================================

    for (const file of files) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        if (extension === "html") {

            htmlFiles.push(file);

        }

        else if (extension === "css") {

            cssFiles.push(file);

        }

        else if (extension === "js") {

            jsFiles.push(file);

        }

    }


    // ================================
    // Detect Global Variable Conflicts
    // ================================

    conflictFileList.innerHTML = "";
    conflictError.style.display = "none";

    const conflictResults =
        await detectGlobalVariableConflicts(jsFiles);

    // console.log("JS files scanned:", jsFiles.map(file => file.relativePath || file.name));
    // console.log("Conflict results:", conflictResults);
    // console.log(
    //     "Top-level declarations:",
    //     await Promise.all(
    //         jsFiles.map(async file => ({
    //             file: file.relativePath || file.name,
    //             source: await file.text()
    //         }))
    //     )
    // );

    if (conflictResults.conflicts.length > 0) {

        conflictError.style.display = "";

        for (const conflict of conflictResults.conflicts) {

            const item =
                document.createElement("li");

            const fileDetails =
                conflict.declarations
                    .map(entry =>
                        `${entry.file} (${entry.kind}, line ${entry.line ?? "unknown"})`
                    )
                    .join(", ");

            item.textContent =
                `${conflict.name}: ${fileDetails}`;

            conflictFileList.appendChild(item);

        }

    }



    // ================================
    // Select Main HTML
    // ================================

    const mainHTML =
        htmlFiles.find(
            file =>
                file.name.toLowerCase() === "index.html"
        )
        || htmlFiles[0];


    // ================================
    // Display Files
    // ================================

    for (const file of files) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        const item =
            document.createElement("li");

        item.textContent =
            file.name;


        if (
            file === mainHTML ||
            extension === "css" ||
            extension === "js"
        ) {

            mergeFileList.appendChild(item);

        }

        else {

            ignoredFileList.appendChild(item);

        }

    }


    // console.log("Main HTML:", mainHTML);
    // console.log("CSS Files:", cssFiles);
    // console.log("JS Files:", jsFiles);
}

filePicker.addEventListener(
    "change",
    updateFilePreview
);

folderPicker.addEventListener(
    "change",
    updateFilePreview
);

const mergeButton =
    document.querySelector("#merge-button");


mergeButton.addEventListener(
    "click",
    async () => {

        const files =
            await getSelectedFiles();

        const htmlFiles = [];
        const cssFiles = [];
        const jsFiles = [];

        for (const file of files) {

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();

            if (extension === "html") {

                htmlFiles.push(file);

            }

            else if (extension === "css") {

                cssFiles.push(file);

            }

            else if (extension === "js") {

                jsFiles.push(file);

            }

        }


        const mainHTML =
            htmlFiles.find(
                file =>
                    file.name
                        .toLowerCase() === "index.html"
            )
            || htmlFiles[0];


        if (!mainHTML) {

            console.log("No HTML file found.");

            return;

        }

        const htmlContent =
            await getFileContent(mainHTML);


        const htmlWithFilename =
            `<!-- ===== HTML: ${mainHTML.relativePath || mainHTML.name} ===== -->\n${htmlContent}`;


        const cssContents = [];

        for (const file of cssFiles) {

            const content =
                await getFileContent(file);

            cssContents.push(
                `/* ===== CSS: ${file.relativePath || file.name} ===== */\n${content}`
            );

        }

        const jsContents = [];

        for (const file of jsFiles) {

            const content =
                await getFileContent(file);

            jsContents.push(
                `// ===== JS: ${file.relativePath || file.name} =====\n${content}`
            );

        }

        const cssContent =
            cssContents.join("\n");

        const jsContent =
            jsContents.join("\n");

        const cleanedHTML =
            cleanHTMLReferences(
                htmlWithFilename,
                cssFiles,
                jsFiles
            );

        const mergedHTML =
            mergeContent(
                cleanedHTML,
                cssContent,
                jsContent
            );

        downloadHTML(mergedHTML);
    }
);

async function getFileContent(file) {

    return await file.text();

}



function cleanHTMLReferences(
    html,
    cssFiles,
    jsFiles
) {

    // ================================
    // Clean CSS References
    // ================================

    for (const file of cssFiles) {

        const fileName = file.name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const pattern = new RegExp(
            `<link\\b(?=[^>]*\\bhref\\s*=\\s*["'][^"']*${fileName}["'])[^>]*>`,
            "gi"
        );

        html = html.replace(pattern, "");

    }


    // ================================
    // Clean JavaScript References
    // ================================

    for (const file of jsFiles) {

        const fileName = file.name.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const pattern = new RegExp(
            `<script\\b(?=[^>]*\\bsrc\\s*=\\s*["'][^"']*${fileName}["'])[^>]*>\\s*<\\/script\\s*>`,
            "gi"
        );

        html = html.replace(pattern, "");

    }

    return html;

}


function mergeContent(
    html,
    cssContent,
    jsContent
) {

    const style =
        `<style>\n${cssContent}\n</style>`;

    const safeJSContent =
        jsContent.replace(
            /<\/script/gi,
            "<\\/script"
        );

    const script =
        `<script>\n${safeJSContent}\n</script>`;


    html =
        html.replace(
            /<\/head>/i,
            `${style}\n</head>`
        );


    if (/<\/body\s*>/i.test(html)) {
        html = html.replace(
            /<\/body\s*>/i,
            `${script}\n</body>`
        );
    } else {
        html = html.replace(
            /<\/html\s*>/i,
            `${script}\n</html>`
        );
    }


    return html;

}

function downloadHTML(html) {

    const blob =
        new Blob(
            [html],
            {
                type: "text/html"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download = "merged.html";

    link.click();

    URL.revokeObjectURL(url);

}


async function extractZipFiles(zipFile) {

    const zip =
        await JSZip.loadAsync(zipFile);

    const extractedFiles = [];

    for (const [path, entry] of Object.entries(zip.files)) {

        if (entry.dir) {
            continue;
        }

        const extension =
            path
                .split(".")
                .pop()
                .toLowerCase();

        if (
            extension !== "html" &&
            extension !== "css" &&
            extension !== "js"
        ) {
            continue;
        }

        const content =
            await entry.async("string");

        const file =
            new File(
                [content],
                path.split("/").pop(),
                {
                    type:
                        extension === "html"
                            ? "text/html"
                            : extension === "css"
                                ? "text/css"
                                : "text/javascript"
                }
            );

        file.relativePath = path;

        extractedFiles.push(file);

    }

    return extractedFiles;

}



async function getSelectedFiles() {

    const selectedFiles = [
        ...filePicker.files,
        ...folderPicker.files
    ];

    const files = [];

    for (const file of selectedFiles) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        if (extension === "zip") {

            const extractedFiles =
                await extractZipFiles(file);

            files.push(...extractedFiles);

        } else {

            file.relativePath =
                file.webkitRelativePath || file.name;

            files.push(file);

        }

    }

    return files;

}


async function detectGlobalVariableConflicts(jsFiles) {

    const declarations = new Map();
    const parseErrors = [];

    for (const file of jsFiles) {

        const source =
            await file.text();

        let ast;

        try {

            ast = acorn.parse(source, {
                ecmaVersion: "latest",
                sourceType: "script"
            });

        } catch (error) {

            parseErrors.push({
                file: file.relativePath || file.name,
                message: error.message
            });

            continue;

        }

        // Inspect only declarations directly
        // inside the top-level script scope.

        for (const node of ast.body) {

            if (
                node.type !== "VariableDeclaration"
            ) {
                continue;
            }

            for (const declaration of node.declarations) {

                const names = [];

                function collectNames(pattern) {

                    if (pattern.type === "Identifier") {

                        names.push(pattern.name);

                    } else if (
                        pattern.type === "ArrayPattern"
                    ) {

                        for (const element of pattern.elements) {

                            if (element) {
                                collectNames(element);
                            }

                        }

                    } else if (
                        pattern.type === "ObjectPattern"
                    ) {

                        for (const property of pattern.properties) {

                            if (property.type === "RestElement") {

                                collectNames(property.argument);

                            } else {

                                collectNames(property.value);

                            }

                        }

                    } else if (
                        pattern.type === "RestElement" ||
                        pattern.type === "AssignmentPattern"
                    ) {

                        collectNames(
                            pattern.type === "RestElement"
                                ? pattern.argument
                                : pattern.left
                        );

                    }

                }

                collectNames(declaration.id);

                for (const name of names) {

                    if (!declarations.has(name)) {
                        declarations.set(name, []);
                    }

                    declarations.get(name).push({
                        file: file.relativePath || file.name,
                        kind: node.kind,
                        line: declaration.loc
                            ? declaration.loc.start.line
                            : null
                    });

                }

            }

        }

    }

    const conflicts = [];

    for (const [name, entries] of declarations) {

        const uniqueFiles = [
            ...new Set(
                entries.map(entry => entry.file)
            )
        ];

        if (uniqueFiles.length > 1) {

            conflicts.push({
                name,
                declarations: entries
            });

        }

    }

    return {
        conflicts,
        parseErrors
    };

}
