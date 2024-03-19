document.getElementById('convertButton').addEventListener('click', async function() {
    const inputCode = document.getElementById('inputCode').value;
    let title = "HLSLShader";
    let author = "Shader author";
    let outputCode = inputCode.replaceAll('texture(iChannel0,', 'ShaderTexture.Sample(Sampler,');
    outputCode = inputCode.replaceAll('vec2', 'float2');
    outputCode = inputCode.replaceAll('vec3', 'float3');
    outputCode = inputCode.replaceAll('vec4', 'float4');
    outputCode = inputCode.replaceAll('mix(', 'lerp(');
    // remove mainImage() declrataion
    const regex = /void mainImage.*?\{/gs;
    outputCode = outputCode.replace(regex, '');
    // remove final } of mainImage()
    const lastIndex = outputCode.lastIndexOf('}');
    if (lastIndex !== -1) {
        outputCode = outputCode.substring(0, lastIndex) + outputCode.substring(lastIndex + 1);
    }

    // Get shader name and author from provided code
    var lines = outputCode.split('\n');
    var newCode = "";
    lines.forEach(function(line, i, object) {
        let reAdd = true;
        if (line.includes('void mainImage')) {
            reAdd = false;
        }
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
        if (reAdd) newCode += line + "\n";
    });
    // TODO: remove {} opening and trailing braces from mainImage()
    outputCode = newCode;

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
        downloadButton.textContent = '⇩ Download HLSL File';
        document.querySelector('#content').appendChild(downloadButton);
    }
    
    // Set the download link with the converted code
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(outputCode);
    downloadButton.setAttribute('href', dataUri);
    downloadButton.setAttribute('download', author + ' ' + title + '.hlsl');
    copyButton.onclick = function() {
        navigator.clipboard.writeText(outputCode);
        alert("Copied");
    }
    
    // Change button to an anchor to support download attribute
    downloadButton.outerHTML = downloadButton.outerHTML.replace(/^<button/, '<a class="button"').replace(/button>$/, 'a>');

});
