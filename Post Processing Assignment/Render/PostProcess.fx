//--------------------------------------------------------------------------------------
//	File: PostProcess.fx
//
//	Post processing shaders
//--------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------
// Global Variables
//--------------------------------------------------------------------------------------

// Post Process Area - Dimensions
float2 PPAreaTopLeft;     // Top-left and bottom-right coordinates of area to post process, provided as UVs into the scene texture...
float2 PPAreaBottomRight; // ... i.e. the X and Y coordinates range from 0.0 to 1.0 from left->right and top->bottom of viewport
float  PPAreaDepth;       // Depth buffer value for area (0.0 nearest to 1.0 furthest). Full screen post-processing uses 0.0f

// Other variables used for individual post-processes
float tintHue;
float blur;
float shockwaveAngle;

// Texture maps
Texture2D SceneTexture;   // Texture containing the scene to copy to the full screen quad
Texture2D PostProcessMap; // Second map for special purpose textures used during post-processing

// Samplers to use with the above texture maps. Specifies texture filtering and addressing mode to use when accessing texture pixels
// Usually use point sampling for the scene texture (i.e. no bilinear/trilinear blending) since don't want to blur it in the copy process
SamplerState PointClamp
{
    Filter = MIN_MAG_MIP_POINT;
    AddressU = Clamp;
    AddressV = Clamp;
	MaxLOD = 0.0f;
};

// See comment above. However, screen distortions may benefit slightly from bilinear filtering (not tri-linear because we won't create mip-maps for the scene each frame)
SamplerState BilinearClamp
{
    Filter = MIN_MAG_LINEAR_MIP_POINT;
    AddressU = Clamp;
    AddressV = Clamp;
	MaxLOD = 0.0f;
};

// Use other filtering methods for the special purpose post-processing textures (e.g. the noise map)
SamplerState BilinearWrap
{
    Filter = MIN_MAG_LINEAR_MIP_POINT;
    AddressU = Wrap;
    AddressV = Wrap;
};
SamplerState TrilinearWrap
{
    Filter = MIN_MAG_MIP_LINEAR;
    AddressU = Wrap;
    AddressV = Wrap;
};


//--------------------------------------------------------------------------------------
// Structures
//--------------------------------------------------------------------------------------

// The full-screen and area post-processing vertex shader input uses a special input type, the vertex ID. This value is automatically generated and does
// not come from a vertex buffer. The value starts at 0 and increases by one with each vertex processed.
struct VS_POSTPROCESS_INPUT
{
    uint vertexId : SV_VertexID;
};

// Vertex shader output / pixel shader input for the post processing shaders
// Provides the viewport positions of the quad to be post processed, then *two* UVs. The Scene UVs indicate which part of the 
// scene texture is being post-processed. The Area UVs range from 0->1 within the area only - these UVs can be used to apply a
// second texture to the area itself, or to find the location of a pixel within the area affected (the Scene UVs could be
// used together with the dimensions variables above to calculate this 2nd set of UVs, but this way saves pixel shader work)
struct PS_POSTPROCESS_INPUT
{
    float4 ProjPos : SV_POSITION;
	float2 UVScene : TEXCOORD0;
	float2 UVArea  : TEXCOORD1;
};



//--------------------------------------------------------------------------------------
// Vertex Shaders
//--------------------------------------------------------------------------------------

// Post Process Full Screen and Area - Generate Vertices
//
// This rather unusual shader generates its own vertices - the input data is merely the vertex ID - an automatically generated increasing index.
// No vertex or index buffer required, so convenient on the C++ side. Probably not so efficient, but fine for just a few post-processing quads
PS_POSTPROCESS_INPUT PPQuad(VS_POSTPROCESS_INPUT vIn)
{
    PS_POSTPROCESS_INPUT vOut;
	
	// The four points of a full-screen quad - will use post process area dimensions (provided above) to scale these to the correct quad needed
	float2 Quad[4] =  { float2(0.0, 0.0),   // Top-left
	                    float2(1.0, 0.0),   // Top-right
	                    float2(0.0, 1.0),   // Bottom-left
	                    float2(1.0, 1.0) }; // Bottom-right

	// vOut.UVArea contains UVs for the area itself: (0,0) at top-left of area, (1,1) at bottom right. Simply the values stored in the Quad array above.
	vOut.UVArea = Quad[vIn.vertexId]; 

	// vOut.UVScene contains UVs for the section of the scene texture to use. The top-left and bottom-right coordinates are provided in the PPAreaTopLeft and
	// PPAreaBottomRight variables one pages above, use lerp to convert the Quad values above into appopriate coordinates (see AreaPostProcessing lab for detail)
	vOut.UVScene = lerp( PPAreaTopLeft, PPAreaBottomRight, vOut.UVArea ); 
	             
	// vOut.ProjPos contains the vertex positions of the quad to render, measured in viewport space here. The x and y are same as Scene UV coords but in range -1 to 1 (and flip y axis),
	// the z value takes the depth value provided for the area (PPAreaDepth) and a w component of 1 to prevent the perspective divide (already did that in the C++)
	vOut.ProjPos  = float4( vOut.UVScene * 2.0f - 1.0f, PPAreaDepth, 1.0f ); 
	vOut.ProjPos.y = -vOut.ProjPos.y;
	
    return vOut;
}


//--------------------------------------------------------------------------------------
// Post-processing Pixel Shaders
//--------------------------------------------------------------------------------------

float3 HueToRGB(float p,float q,float t) {
	if (t < 0.0f) ++t;
	if (t > 1.0f) --t;
	if (t < 0.16666666666f) return p + (q - p) * 6.0f * t;
	if (t < 0.5f) return q;
	if (t < 0.66666666666f) return p + (q - p) * (0.6666666666f - t) * 6.0f;
	return p;
}

float3 HSLToRGB(float3 colour) {
	float h = colour.r;
	float s = colour.g;
	float l = colour.b;
	float q = l < 0.5f ? l * (1.0f + s) : l + s - l * s;
	float p = 2.0f * l - q;
	colour.r = HueToRGB(p,q,h + 0.3333333333f);
	colour.g = HueToRGB(p,q,h);
	colour.b = HueToRGB(p,q,h - 0.3333333333f);

	return colour;
}

// Post-processing shader that simply outputs the scene texture, i.e. no post-processing. A waste of processing, but illustrative
float4 PPCopyShader( PS_POSTPROCESS_INPUT ppIn ) : SV_Target
{
	float3 colour = SceneTexture.Sample( PointClamp, ppIn.UVScene );
	return float4( colour, 1.0f );
}

float4 PPGradualTintShader( PS_POSTPROCESS_INPUT ppIn) : SV_TARGET {
	float3 colour = SceneTexture.Sample(PointClamp,ppIn.UVScene) * HSLToRGB(float3(tintHue,1.0f,0.5f));
	return float4(colour,1.0f);
}

const float offset[3] = {0.0f,1.3846153846f,3.2307692308f};
const float weight[3] = {0.2270270270f,0.3162162162f,0.0702702703f};

// Horizontal Blur
// Offsets should be divided by viewport width/height, but manually changing this seems to intensify the blur
float4 PP2XGaussianBlurShader_Horizontal( PS_POSTPROCESS_INPUT ppIn) : SV_TARGET {
	float4 colour = float4(0.0f,0.0f,0.0f,0.0f);
	for (int i = 0; i < 3; ++i) {
		colour += SceneTexture.Sample(PointClamp,ppIn.UVScene + float2(offset[i] / (200.0f * blur),0.0f)) * weight[i]
			    + SceneTexture.Sample(PointClamp,ppIn.UVScene - float2(offset[i] / (200.0f * blur),0.0f)) * weight[i];
	}

	return SceneTexture.Sample(PointClamp, ppIn.UVScene) * weight[0] + colour;
}

float4 PP2XGaussianBlurShader_Vertical(PS_POSTPROCESS_INPUT ppIn) : SV_TARGET{
	float4 colour = float4(0.0f,0.0f,0.0f,0.0f);

	for (int i = 0; i < 3; ++i) {
		colour += SceneTexture.Sample(PointClamp,ppIn.UVScene + float2(0.0f,offset[i] / (200.0f * blur))) * weight[i]
			   +  SceneTexture.Sample(PointClamp,ppIn.UVScene - float2(0.0f,offset[i] / (200.0f * blur))) * weight[i];
	}

	return (SceneTexture.Sample(PointClamp, ppIn.UVScene) * weight[0] + colour) * 0.5f;
}

const float shakeSize = 0.01f;
const float hPi = 3.14159265359f * 0.5f;

float4 PPShockWaveShader(PS_POSTPROCESS_INPUT ppIn) : SV_TARGET{
	return SceneTexture.Sample(PointClamp,ppIn.UVScene + 
		float2(cos(hPi + shockwaveAngle) * shakeSize,0.0f)
	);
}

float4 PPDepthOfFeildShader(PS_POSTPROCESS_INPUT ppIn) : SV_TARGET {
	float4 colour = SceneTexture.Sample(PointClamp,ppIn.UVScene);

	if (colour.w > 0.5f)
		return float4(0.0f,0.0f,0.5f,0.0f) + colour;
		else
		return colour;
}

//--------------------------------------------------------------------------------------
// States
//--------------------------------------------------------------------------------------

RasterizerState CullBack  // Cull back facing polygons - post-processing quads should be oriented facing the camera
{
	CullMode = None;
};
RasterizerState CullNone  // Cull none of the polygons, i.e. show both sides
{
	CullMode = None;
};

DepthStencilState DepthWritesOn  // Write to the depth buffer - normal behaviour 
{
	DepthWriteMask = ALL;
};
DepthStencilState DepthWritesOff // Don't write to the depth buffer, but do read from it - useful for area based post-processing. Full screen post-process is given 0 depth, area post-processes
{                                // given a valid depth in the scene. Post-processes will not obsucre each other (in particular full-screen will not obscure area), but sorting issues may remain
	DepthWriteMask = ZERO;
};
DepthStencilState DisableDepth   // Disable depth buffer entirely
{
	DepthFunc      = ALWAYS;
	DepthWriteMask = ZERO;
};

BlendState NoBlending // Switch off blending - pixels will be opaque
{
    BlendEnable[0] = FALSE;
};
BlendState AlphaBlending
{
    BlendEnable[0] = TRUE;
    SrcBlend = SRC_ALPHA;
    DestBlend = INV_SRC_ALPHA;
    BlendOp = ADD;
};


//--------------------------------------------------------------------------------------
// Post Processing Techniques
//--------------------------------------------------------------------------------------

// Simple copy technique - no post-processing (pointless but illustrative)
technique10 PPCopy
{
    pass P0
    {
        SetVertexShader( CompileShader( vs_4_0, PPQuad() ) );
        SetGeometryShader( NULL );                                   
        SetPixelShader( CompileShader( ps_4_0, PPCopyShader() ) );

		SetBlendState( NoBlending, float4( 0.0f, 0.0f, 0.0f, 0.0f ), 0xFFFFFFFF );
		SetRasterizerState( CullBack ); 
		SetDepthStencilState( DepthWritesOff, 0 );
     }
}


// Tint the scene to a colour

technique10 PPGradualTint {
	pass P0 {
		SetVertexShader(CompileShader(vs_4_0, PPQuad()));
		SetGeometryShader(NULL);
		SetPixelShader(CompileShader(ps_4_0, PPGradualTintShader()));

		SetBlendState(NoBlending, float4(0.0f, 0.0f, 0.0f, 0.0f), 0xFFFFFFFF);
		SetRasterizerState(CullBack);
		SetDepthStencilState(DepthWritesOff, 0);
	}
}

technique10 PP2XGaussianBlur_Horizontal {
	pass P0 {
		SetVertexShader(CompileShader(vs_4_0, PPQuad()));
		SetGeometryShader(NULL);
		SetPixelShader(CompileShader(ps_4_0, PP2XGaussianBlurShader_Horizontal()));

		SetBlendState(NoBlending, float4(0.0f, 0.0f, 0.0f, 0.0f), 0xFFFFFFFF);
		SetRasterizerState(CullBack);
		SetDepthStencilState(DepthWritesOff, 0);
	}
}

technique10 PP2XGaussianBlur_Vertical {
	pass P0 {
		SetVertexShader(CompileShader(vs_4_0, PPQuad()));
		SetGeometryShader(NULL);
		SetPixelShader(CompileShader(ps_4_0, PP2XGaussianBlurShader_Vertical()));

		SetBlendState(NoBlending, float4(0.0f, 0.0f, 0.0f, 0.0f), 0xFFFFFFFF);
		SetRasterizerState(CullBack);
		SetDepthStencilState(DepthWritesOff, 0);
	}
}

technique10 PPShockWave {
	pass P0 {
		SetVertexShader(CompileShader(vs_4_0, PPQuad()));
		SetGeometryShader(NULL);
		SetPixelShader(CompileShader(ps_4_0, PPShockWaveShader()));

		SetBlendState(NoBlending, float4(0.0f, 0.0f, 0.0f, 0.0f), 0xFFFFFFFF);
		SetRasterizerState(CullBack);
		SetDepthStencilState(DepthWritesOff, 0);
	}
}

technique10 PPDepthOfFeild {
	pass P0 {
		SetVertexShader(CompileShader(vs_4_0, PPQuad()));
		SetGeometryShader(NULL);
		SetPixelShader(CompileShader(ps_4_0, PPDepthOfFeildShader()));

		SetBlendState(NoBlending, float4(0.0f, 0.0f, 0.0f, 0.0f), 0xFFFFFFFF);
		SetRasterizerState(CullBack);
		SetDepthStencilState(DepthWritesOff, 0);
	}
}
