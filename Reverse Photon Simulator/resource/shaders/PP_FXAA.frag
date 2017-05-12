#version 300 es
precision highp sampler2D;
precision highp float;
precision highp int;

/*
	a GLSL implementation of FXAA
	Original source code http://developer.download.nvidia.com/assets/gamedev/files/sdk/11/FXAA_WhitePaper.pdf
	
	Works by performing edge detection based on luminocity
	taking neighbouring pixels in an X pattern
	e.g. X X
		  X
		 X X
		 
	and applying a slight blur if it does come across an edge
*/

const float FXAA_REDUCE_MIN = 1.0 / 128.0;
const float FXAA_REDUCE_MUL = 1.0 / 8.0;
const float FXAA_SPAN_MAX 	= 8.0;
const vec3  LUMA 			= vec3(0.299,0.587,0.114);

uniform sampler2D s_sceneTexture;
uniform vec2 v_sceneTextureSize;

in vec2 v_texPos;
out vec4 colour;

void main() {
	vec2 pixel = vec2(1.0 / v_sceneTextureSize.x,1.0 / v_sceneTextureSize.y);
	vec3 rgbTL = texture(s_sceneTexture,v_texPos + vec2(-pixel.x,-pixel.y)).rgb;
	vec3 rgbTR = texture(s_sceneTexture,v_texPos + vec2( pixel.x,-pixel.y)).rgb;
	vec3 rgbBL = texture(s_sceneTexture,v_texPos + vec2(-pixel.x, pixel.y)).rgb;
	vec3 rgbBR = texture(s_sceneTexture,v_texPos + vec2( pixel.x, pixel.y)).rgb;
	vec3 rgbM  = texture(s_sceneTexture,v_texPos).rgb;
	
	float lumaTL = dot(rgbTL, LUMA);
	float lumaTR = dot(rgbTR, LUMA);
	float lumaBL = dot(rgbBL, LUMA);
	float lumaBR = dot(rgbBR, LUMA);
	float lumaM  = dot(rgbM,  LUMA);
	float lumaMin = min(lumaM, min(min(lumaTL, lumaTR), min(lumaBL, lumaBR)));
	float lumaMax = max(lumaM, max(max(lumaTL, lumaTR), max(lumaBL, lumaBR)));
	
	vec2 dir = vec2(
		-((lumaTL + lumaTR) - (lumaBL + lumaBR)),
		  (lumaTL + lumaBL) - (lumaTR + lumaBR)
	);
	
	
	float dirReduce = max((lumaTL + lumaTR + lumaBL + lumaBR) * (0.25 * FXAA_REDUCE_MUL),FXAA_REDUCE_MIN);
	float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);
	
	dir = min(vec2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),dir * rcpDirMin)) * pixel;

	vec3 c_1 = 0.5 * (
		texture(s_sceneTexture,v_texPos + dir * (1.0/3.0 - 0.5)).rgb +
		texture(s_sceneTexture,v_texPos + dir * 		   0.5).rgb
	);
	
	vec3 c_2 = c_1 * 0.5 + 0.25 *
		(texture(s_sceneTexture,v_texPos.xy + dir * -0.5).rgb +
		 texture(s_sceneTexture,v_texPos.xy + dir *  0.5).rgb);
	
	float luma = dot(c_2, LUMA);
	
	// Branching Incurred (Possible optimization)
	if((luma < lumaMin) || (luma > lumaMax))
		colour.rgb = c_1;
	else
		colour.rgb = c_2;
	
	colour.a = 1.0;
}