document.getElementById('convertButton').addEventListener('click', async function() {
    const inputCode = document.getElementById('inputCode').value;
    let title = "HLSLShader";
    let author = "Shader author";
    let outputCode = inputCode.replaceAll('texture(iChannel0,', 'ShaderTexture.Sample(Sampler,');
    outputCode = outputCode.replaceAll('vec2', 'float2');
    outputCode = outputCode.replaceAll('vec3', 'float3');
    outputCode = outputCode.replaceAll('vec4', 'float4');
    outputCode = outputCode.replaceAll('mix(', 'lerp(');
    outputCode = outputCode.replaceAll('fract(', 'frac(');
    // need to adjust float assignments with single param
    // exmample: vec3(1.0)
    // hlsl needs 3 params: float3(1.0, 1.0, 1.0)
    //outputCode = adjustShaderParameters(outputCode);

    // hlsl cant handle operations with swizzling unless
    // operands are both same type (float / float2)
    // example:
    //   float2 movedUV = blockUV + dir * (2.0 / iResolution.xy);
    // however, these work:
    //   float2 movedUV = blockUV + dir * (2.0 / iResolution);
    //   float2 movedUV = blockUV + dir * (float2(2.0, 2.0) / iResolution.xy);
    // solution: parse to check operands in every operation and return type

    // Get shader name and author from provided code
    var lines = outputCode.split('\n');
    lines.forEach(function(line, i, object) {
        if (line.includes("//")) {
            // Convert line to lowercase for case-insensitive search
            var lcase = line.toLowerCase();
            var index = lcase.indexOf("title:");
            if (index !== -1) {
                title = line.substring(index + 7).trim();
            }
            index = lcase.indexOf("author:");
            if (index !== -1) {
                author = line.substring(index + 8).trim();
            }
        }
    });
    // set initial string to get all initial content prior to mainImage()
    let startMainImage = outputCode.indexOf("void mainImage");
    var initial = outputCode.substring(0, startMainImage);
    // get all content following mainImage's opening {
    let openBrace = outputCode.indexOf("{", startMainImage);
    outputCode = outputCode.substring(openBrace + 1);
    let closeBrace = outputCode.lastIndexOf("}");
    // remove closing brace of mainImage()
    outputCode = outputCode.substring(0, closeBrace);

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
        if (initial !== "") {
            t = t.replace("// Shadertoy initial.", initial);
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
