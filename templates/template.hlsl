Texture2D ShaderTexture : register(t0);
SamplerState Sampler : register(s0);

cbuffer PixelShaderSettings
{
    float Time;
    float Scale;
    float2 Resolution;
    float4 Background;
};

float4 main(float4 fragCoord : SV_POSITION, float2 hlsluv : TEXCOORD) : SV_TARGET
{
    float iTime = Time;
    float2 iResolution = Resolution;
    float4 fragColor;

    // Shadertoy code START here.
    float2 uv = fragCoord.xy / iResolution.xy;
    float2 center = float2(0.5, 0.5);
    fragColor = float4(1.0, 1.0, 1.0, 1.0);
    // Shadertoy code END here.

    return fragColor;
}
