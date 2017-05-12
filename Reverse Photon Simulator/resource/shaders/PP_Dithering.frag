#version 300 es
precision highp sampler2D;
precision highp float;
precision highp int;

// 4x4 Ordered Dithering Matrix
const int BAYER_MATRIX[16] = int[](0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5);

uniform sampler2D s_sceneTexture;

in vec2 v_texPos;
out vec4 v_colour;

float sampleMatrix(int x,int y) {
	return float(BAYER_MATRIX[x + 4 * y]) / 255.0;
}

void main() {
	s_sceneTexture;
	v_colour = texture(s_sceneTexture,v_texPos);
	
	v_colour.r += sampleMatrix( int(gl_FragCoord.x) % 4,int(gl_FragCoord.y) % 4 );
	v_colour.g += sampleMatrix( int(gl_FragCoord.x) % 4,int(gl_FragCoord.y) % 4 );
	v_colour.b += sampleMatrix( int(gl_FragCoord.x) % 4,int(gl_FragCoord.y) % 4 );
}