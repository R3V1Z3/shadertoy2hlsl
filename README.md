Shadertoy to HLSL converter specially made for Windows Terminal.

## What it does currently
- Adds user provided Shadertoy code into the appropriate spot in a template.
- Replaces vec2, vec3 and vec4 declarations with float2, float3, float4.
- Ensures texture calls `texture(iChannel0,` are replaced with `ShaderTexture.Sample(Sampler,`
- Replaces `mix(` with `lerp(`
