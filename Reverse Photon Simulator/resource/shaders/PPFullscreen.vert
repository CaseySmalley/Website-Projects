#version 300 es
precision highp float;
precision highp int;

// General use post processing shader, creates fullscreen quad and provides texture coordinates

const vec2 texUV[] = vec2[](
	vec2( 0.0, 1.0),vec2( 0.0, 0.0),
	vec2( 1.0, 1.0),vec2( 1.0, 0.0)
);

const vec2 quad[] = vec2[](
	vec2(-1.0, 1.0),vec2(-1.0,-1.0),
	vec2( 1.0, 1.0),vec2( 1.0,-1.0)
);

out vec2 v_texPos;

void main() {
	v_texPos = texUV[gl_VertexID];
	gl_Position = vec4(quad[gl_VertexID],0.0,1.0);
}