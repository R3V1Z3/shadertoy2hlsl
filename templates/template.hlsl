Texture2D ShaderTexture : register(t0);
SamplerState Sampler : register(s0);

cbuffer PixelShaderSettings
{
    float Time;
    float Scale;
    float2 Resolution;
    float4 Background;
};

// extract content of mainImage function
// update content as follows;
//   replace vec2, vec3 and vec4 with float2, float3, float4
//   replace `texture(iChannel0,` with `ShaderTexture.Sample(Sampler,`
//   replace mix( with lerp(
// remove mainImage declaration
// paste updated content of mainImage into START area below
float4 main(float4 fragCoord : SV_POSITION, float2 hlsluv : TEXCOORD) : SV_TARGET
{
    float iTime = Time;
    float2 iResolution = Resolution;
    float4 fragColor;
    float2 uv = fragCoord.xy / iResolution.xy;

    // Shadertoy code START here.
    float2 center = float2(0.5, 0.5);
    float distanceFromCenter = length(uv - center);
    float ZGEcurveStrength = 0.25;
    float ZGEcurveDistance = 2.05;
    uv += (uv - center) * pow(distanceFromCenter, ZGEcurveDistance) * ZGEcurveStrength;

    distanceFromCenter = length(uv - center);

    // Color shifting
    float ZGEcolorShift = 0.3; // Range: 0.0, 1.0
    float fade = ZGEcolorShift;
    float ZGEshiftScale = 2.45; // Range: 0.0, 10.0
    float timeFactor = sin(Time * ZGEshiftScale);
    float f = 1.0 + fade * timeFactor;
    float3 color = ShaderTexture.Sample(Sampler, uv).rgb * float3(f, f, f);

    // RGB offset
    float ZGErgbOffset = 0.002; // Range: 0.0, 0.5
    float3 offsets = float3(ZGErgbOffset, 0.0, 0.0-ZGErgbOffset);
    float3 baseColor = ShaderTexture.Sample(Sampler, uv).rgb;
    float3 redColor = ShaderTexture.Sample(Sampler, uv + float2(offsets.x, 0.0)).rgb;
    float3 greenColor = ShaderTexture.Sample(Sampler, uv + float2(0.0, offsets.y)).rgb;
    float3 blueColor = ShaderTexture.Sample(Sampler, uv + float2(offsets.z, 0.0)).rgb;
    color += float3(redColor.r, greenColor.g, blueColor.b);

    float grillDensity = 800.0;
    float grillIntensity = 0.5;
    float scanlineDensity = 3.0;
    float scanlineIntensity = 0.75;
    
    float grillPattern = sin(uv.x * grillDensity * 3.14159);
    grillPattern = grillIntensity + (1.0 - grillIntensity) * grillPattern;
    float scanlinePattern = sin(uv.y * Resolution.y * 3.14159 / scanlineDensity);
    float3 c = color * (0.5 + 0.5 * grillPattern) * (scanlineIntensity + (1.0 - scanlineIntensity) * scanlinePattern);

    // Gray-ish tint of TV screen
    float ZGEtint = 0.25; // Range: 0.0, 1.0
    float t = 0.5 + 0.5 * uv.y;
    float multiplier = 1.5; // 1.2
    float3 grayTint = float3(t, t * multiplier, t * multiplier);
    // color = mix(color, grayTint, ZGEtint);
    c += grayTint * ZGEtint;

    // Vignette
    float ZGEvignetteStart = 0.25; //Range: 0.0, 2.0
    float ZGEvignetteLvl = 20.0; //Range: 1.0, 20.0
    float2 vuv = uv * (1.0 - uv.yx);
    c *= pow(vuv.x * vuv.y * ZGEvignetteLvl, ZGEvignetteStart);

    // Border
    float ZGEborder = 2.0; // Adjusted for visibility, range: 0.0, 20.0
    float nX = ZGEborder / Resolution.x;
    float nY = ZGEborder / Resolution.y;

    // Determine if the current fragment is within the border width
    bool isBorder = uv.x < nX || uv.x > 1.0 - nX ||
                    uv.y < nY || uv.y > 1.0 - nY;

    // Calculate border intensity based on distance to center
    float intensity = 0.0;
    if(isBorder) {
        // Calculate minimum distance to the border
        float distX = min(uv.x, 1.0-uv.x);
        float distY = min(uv.y, 1.0-uv.y);
        float minDist = min(distX, distY);
        
        // Scale intensity based on distance, closer to center gets darker
        intensity = lerp(0.005, 0.0, minDist / max(nX, nY));
        
        // Apply intensity to color
        c = float3(intensity, intensity, intensity); // Gray, darker towards center
    }

    fragColor = float4(c, 1.0);
    // Shadertoy code END here.

    return fragColor;
}
