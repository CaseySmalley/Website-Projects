#version 300 es
precision highp float;
precision highp int;

const float f_PI = 3.14159265359;
const float f_hFOV = 60.0 * (f_PI / 180.0) * 0.5;
const float f_vFOV = 60.0 * (f_PI / 180.0) * 0.5;

const vec2 QUAD[4] = vec2[]( // Coordinates of fullscreen quad corners
	vec2(-1.0, 1.0),vec2(-1.0,-1.0),
	vec2( 1.0, 1.0),vec2( 1.0,-1.0)
);

const vec3 DIRECTION[4] = vec3[]( // Direction values for rays at each corner
	vec3(0.0,0.0,0.0),vec3(0.0,1.0,0.0), // (used in a later lerp call)
	vec3(1.0,0.0,1.0),vec3(1.0,1.0,1.0)
);

uniform vec4 v_camera; // (X,Y,Z,hAngle) <- Rotation around Y axis

// Use seperate variables
// Since in-out interface blocks aren't supported

// The ray directions at the topleft to the bottom right pixel are handed out to
// each fragment for interpolation
flat   out vec3 v_start; // Ray direction at topleft corner
flat   out vec3 v_end; // Ray direction at bottom right corner
flat   out vec3 v_rayOrigin;
smooth out vec3 v_rayDirection; // This is the only "varying" to be interpolated across fragments

void main() {
	v_start = vec3(sin(-f_hFOV + v_camera.w),sin(-f_vFOV),cos(-f_hFOV + v_camera.w));
	v_end   = vec3(sin( f_hFOV + v_camera.w),sin( f_vFOV),cos( f_hFOV + v_camera.w));
	v_rayOrigin = v_camera.xyz;
	v_rayDirection = DIRECTION[gl_VertexID];
	gl_Position = vec4(QUAD[gl_VertexID],0.0,1.0);
}