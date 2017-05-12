precision mediump float;

varying vec2 v_UV;

uniform float f_index;
uniform vec2 v_arrayTextureRes;
uniform sampler2D s_arrayTexture;

// Allow for arbitary access
vec4 get(float index) {
	return texture2D(s_arrayTexture,vec2(
		(mod(index,v_arrayTextureRes.x) + 0.5) / v_arrayTextureRes.x,
		(floor(index / v_arrayTextureRes.x) + 0.5) / v_arrayTextureRes.y
	));
}

void main() {
	gl_FragColor = texture2D(s_arrayTexture,vec2(
		gl_FragCoord.x / 160.0,
		1.0 - (gl_FragCoord.y / 120.0)
	));
	
	if (gl_FragCoord.x > 140.0 && gl_FragCoord.y < 20.0) {
		gl_FragColor = get(f_index);
	}
}