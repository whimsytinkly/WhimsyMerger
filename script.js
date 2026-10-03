const filePicker =
    document.querySelector("#file-picker");

const mergeFileList =
    document.querySelector("#merge-file-list");

const ignoredFileList =
    document.querySelector("#ignored-file-list");


filePicker.addEventListener(
    "change",
    () => {

        const files =
            filePicker.files;

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
);

const mergeButton =
    document.querySelector("#merge-button");


mergeButton.addEventListener(
    "click",
    async () => {

        const files =
            filePicker.files;

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


        const cssContents = [];

        for (const file of cssFiles) {

            const content =
                await getFileContent(file);

            cssContents.push(content);

        }

        const jsContents = [];

        for (const file of jsFiles) {

            const content =
                await getFileContent(file);

            jsContents.push(content);

        }

        const cssContent =
            cssContents.join("\n");

        const jsContent =
            jsContents.join("\n");

        const cleanedHTML =
            cleanHTMLReferences(
                htmlContent,
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

    for (const file of cssFiles) {

        const pattern =
            new RegExp(
                `<link[^>]+href=["']${file.name}["'][^>]*>`,
                "gi"
            );

        html =
            html.replace(
                pattern,
                ""
            );

    }


    for (const file of jsFiles) {

        const pattern =
            new RegExp(
                `<script[^>]+src=["']${file.name}["'][^>]*>[\\s\\S]*?<\\/script>`,
                "gi"
            );

        html =
            html.replace(
                pattern,
                ""
            );

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


    html =
        html.replace(
            /<\/body>/i,
            `${script}\n</body>`
        );


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