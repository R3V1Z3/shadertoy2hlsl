document.getElementById('convertButton').addEventListener('click', async function() {
    const inputCode = document.getElementById('inputCode').value;
    let title = "HLSLShader";
    let author = "Shader author";
    const ZGEvars = [];
    let outputCode = inputCode.replaceAll('texture(', 'texture2D(');
    // Fill vars variable array
    const regex = /float ZGE(\w+)\s*=\s*([^;]+);(?:\s*\/\/\s*Range:\s*(-?[0-9]+\.?[0-9]*),\s*(-?[0-9]+\.?[0-9]*))?/g;
    let matches;
    let varString = "";
    while ((matches = regex.exec(outputCode)) !== null) {
        // Extracting the range values if they are present
        let rangeFrom = matches[3] ? matches[3].trim() : undefined;
        let rangeTo = matches[4] ? matches[4].trim() : undefined;
        varString += "uniform float ZGE" + matches[1] + ';\n';
        ZGEvars.push({
            id: matches[1],
            value: matches[2].trim(),
            rangeFrom: rangeFrom,
            rangeTo: rangeTo,
        });
    }
    // Get shader name and author from provided code
    var lines = outputCode.split('\n');
    outputCode = varString;
    lines.forEach(function(line, i, object) {
        // we don't want to re-add these lines if author and title are found
        // as they're added to the project file
        let reAdd = true;
        if (line.includes("//")) {
            // Convert line to lowercase for case-insensitive search
            var lcase = line.toLowerCase();
            var index = lcase.indexOf("title:");
            if (index !== -1) {
                title = line.substring(index + 7).trim();
                reAdd = false;
            }
            index = lcase.indexOf("author:");
            if (index !== -1) {
                author = line.substring(index + 8).trim();
                reAdd = false;
            }
        }
        // we've already filled the ZGEvars array so lets now remove the lines from the code
        // since they'll be added as uniforms
        if (line.includes("float ZGE")) reAdd = false;
        if (reAdd) outputCode += line + '\n';
    });

    // Splice user code into template
    try {
        const response = await fetch('./templates/template.hlsl');
        if (!response.ok) throw new Error('Network response was not ok.');

        let t = await response.text();
        const startMarker = "// Shadertoy code START here.";
        const endMarker = "// Shadertoy code END here.";

        if(t.includes(startMarker) && t.includes(endMarker)) {
            const startIndex = t.indexOf(startMarker) - 1;
            const endIndex = t.indexOf(endMarker) + endMarker.length + 2;
            t = t.substring(0, startIndex) + '\n' + outputCode + '\n' + t.substring(endIndex);
        }
        
        outputCode = t;
        document.getElementById('outputCode').value = t;
    } catch (error) {
        console.error('Failed to fetch the template:', error);
    }
    
    // Display the notification
    const notification = document.getElementById('notification');
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000); // Hide the notification after 3 seconds

    // Create or update the copy button
    let copyButton = document.getElementById('copyButton');
    let downloadButton = document.getElementById('downloadButton');
    if (!copyButton) { // If the button doesn't exist, create it
        copyButton = document.createElement('button');
        copyButton.id = 'copyButton';
        copyButton.textContent = '🗐 Copy';
        document.querySelector('#content').appendChild(copyButton);
        // Create download button
        downloadButton = document.createElement('button');
        downloadButton.id = 'downloadButton';
        downloadButton.textContent = '⇩ Download ZGE Project';
        document.querySelector('#content').appendChild(downloadButton);
    }
    
    // Set the download link with the converted code
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputCode);
    downloadButton.setAttribute('href', dataUri);
    downloadButton.setAttribute('download', author + ' ' + title + '.zgeproj');
    copyButton.onclick = function() {
        navigator.clipboard.writeText(outputCode);
        alert("Copied");
    }
    
    // Change button to an anchor to support download attribute
    downloadButton.outerHTML = downloadButton.outerHTML.replace(/^<button/, '<a class="button"').replace(/button>$/, 'a>');

});
