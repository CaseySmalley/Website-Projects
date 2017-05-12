#version 300 es
precision highp sampler2D;
precision highp float;
precision highp int;

uniform sampler2D s_sceneTexture;

in vec2 v_texPos;
out vec4 colour;

void main() {
	// Pass input texture to output
	colour = texture(s_sceneTexture,v_texPos);
}