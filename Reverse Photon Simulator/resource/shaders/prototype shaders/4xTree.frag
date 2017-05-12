precision highp float;

uniform float f_treeSize;
uniform float f_rootNode;
uniform vec2 v_fov;
uniform vec3 v_camera; // (x,y,z,angle)
uniform vec2 v_cameraAngle;
uniform vec2 v_projectionDistance;
uniform vec2 v_viewportRes;
uniform vec2 v_treeTextureRes;
uniform sampler2D s_treeTexture;

const float RENDER_DISTANCE = 500.0;

vec4 getLeafNode(float index) {
	return texture2D(s_treeTexture,vec2(
		(mod(index,v_treeTextureRes.x) + 0.5) / v_treeTextureRes.x,
		(floor(index / v_treeTextureRes.x) + 0.5) / v_treeTextureRes.y
	));
}


float getBranchIndex(float index) {
	vec4 branchIndex = texture2D(s_treeTexture,vec2(
		(mod(index,v_treeTextureRes.x) + 0.5) / v_treeTextureRes.x,
		(floor(index / v_treeTextureRes.x) + 0.5) / v_treeTextureRes.y
	));

	return (branchIndex.r * 255.0 * 256.0 * 256.0
		 + branchIndex.g * 255.0 * 256.0
		 + branchIndex.b * 255.0)
		 * branchIndex.w + (branchIndex.w - 1.0);
}

bool rayToAABB(vec3 ro,vec3 rd,vec3 cMin,vec3 cMax) {
	rd.x = 1.0 / rd.x;
	rd.y = 1.0 / rd.y;
	rd.z = 1.0 / rd.z;
	
	float txMin = (cMin.x - ro.x) * rd.x;
	float txMax = (cMax.x - ro.x) * rd.x;
	float tyMin = (cMin.y - ro.y) * rd.y;
	float tyMax = (cMax.y - ro.y) * rd.y;
	float tzMin = (cMin.z - ro.z) * rd.z;
	float tzMax = (cMax.z - ro.z) * rd.z;
	float tMin = max(min(txMin,txMax),max(min(tyMin,tyMax),min(tzMin,tzMax)));
	float tMax = min(max(txMin,txMax),min(max(tyMin,tyMax),max(tzMin,tzMax)));
	
	return (tMax > 0.0 && tMin < tMax);
}

float rayToAABB_Distance(vec3 ro,vec3 rd,vec3 cMin,vec3 cMax) {
	rd.x = 1.0 / rd.x;
	rd.y = 1.0 / rd.y;
	rd.z = 1.0 / rd.z;
	
	float txMin = (cMin.x - ro.x) * rd.x;
	float txMax = (cMax.x - ro.x) * rd.x;
	float tyMin = (cMin.y - ro.y) * rd.y;
	float tyMax = (cMax.y - ro.y) * rd.y;
	float tzMin = (cMin.z - ro.z) * rd.z;
	float tzMax = (cMax.z - ro.z) * rd.z;
	float tMin = max(min(txMin,txMax),max(min(tyMin,tyMax),min(tzMin,tzMax)));
	float tMax = min(max(txMin,txMax),min(max(tyMin,tyMax),max(tzMin,tzMax)));
	
	return float(tMax > 0.0 && tMin < tMax) * tMin;
}

vec4 finalColour = vec4(0.0,0.0,0.0,1.0);

// Max Depth
// Test Against Leaves
vec4 raycast_depth_1(vec3 ro,vec3 rd,vec3 c,float index) {
	vec4 result = vec4(0.0,0.0,0.0,0.0);
	float hSize = f_treeSize * 0.25;
	float qSize = f_treeSize * 0.125;
	
	float ftl = rayToAABB_Distance(ro,rd,vec3(c.x - hSize,c.y,c.z - hSize),vec3(c.x,c.y + hSize,c.z));
	float ftr = rayToAABB_Distance(ro,rd,vec3(c.x,c.y,c.z - hSize),vec3(c.x + hSize,c.y + hSize,c.z));
	float fbl = rayToAABB_Distance(ro,rd,vec3(c.x - hSize,c.y - hSize,c.z - hSize),vec3(c.x,c.y,c.z));
	float fbr = rayToAABB_Distance(ro,rd,vec3(c.x,c.y - hSize,c.z - hSize),vec3(c.x + hSize,c.y,c.z));
	float btl = rayToAABB_Distance(ro,rd,vec3(c.x - hSize,c.y,c.z),vec3(c.x,c.y + hSize,c.z + hSize));
	float btr = rayToAABB_Distance(ro,rd,vec3(c.x,c.y,c.z),vec3(c.x + hSize,c.y + hSize,c.z + hSize));
	float bbl = rayToAABB_Distance(ro,rd,vec3(c.x - hSize,c.y - hSize,c.z),vec3(c.x,c.y,c.z + hSize));
	float bbr = rayToAABB_Distance(ro,rd,vec3(c.x,c.y - hSize,c.z),vec3(c.x + hSize,c.y,c.z + hSize));
	
	vec4 ftl_c = getLeafNode(index    );
	vec4 ftr_c = getLeafNode(index+1.0);
	vec4 fbl_c = getLeafNode(index+2.0);
	vec4 fbr_c = getLeafNode(index+3.0);
	vec4 btl_c = getLeafNode(index+4.0);
	vec4 btr_c = getLeafNode(index+5.0);
	vec4 bbl_c = getLeafNode(index+6.0);
	vec4 bbr_c = getLeafNode(index+7.0);
	
	float ftl_r = sign(ftl * ftl_c.w);
	float ftr_r = sign(ftr * ftr_c.w);
	float fbl_r = sign(fbl * fbl_c.w);
	float fbr_r = sign(fbr * fbr_c.w);
	float btl_r = sign(btl * btl_c.w);
	float btr_r = sign(btr * btr_c.w);
	float bbl_r = sign(bbl * bbl_c.w);
	float bbr_r = sign(bbr * bbr_c.w);
	
	ftl = ftl * ftl_r + RENDER_DISTANCE * (1.0 - ftl_r);
	ftr = ftr * ftr_r + RENDER_DISTANCE * (1.0 - ftr_r);
	fbl = fbl * fbl_r + RENDER_DISTANCE * (1.0 - fbl_r);
	fbr = fbr * fbr_r + RENDER_DISTANCE * (1.0 - fbr_r);
	btl = btl * btl_r + RENDER_DISTANCE * (1.0 - btl_r);
	btr = btr * btr_r + RENDER_DISTANCE * (1.0 - btr_r);
	bbl = bbl * bbl_r + RENDER_DISTANCE * (1.0 - bbl_r);
	bbr = bbr * bbr_r + RENDER_DISTANCE * (1.0 - bbr_r);
	
	result.w = min( min(min(ftl,ftr), min(fbl,fbr) ), min(min(btl,btr), min(bbl,bbr)) );
	
	result.rgb = ftl_c.rgb * float(result.w == ftl)
			   + ftr_c.rgb * float(result.w == ftr)
			   + fbl_c.rgb * float(result.w == fbl)
			   + fbr_c.rgb * float(result.w == fbr)
			   + btl_c.rgb * float(result.w == btl)
			   + btr_c.rgb * float(result.w == btr)
			   + bbl_c.rgb * float(result.w == bbl)
			   + bbr_c.rgb * float(result.w == bbr);
	
	result.w = clamp((result.w / RENDER_DISTANCE),0.0,1.0);
	result.rgb *= 1.0 - result.w;
	return result;
}

vec4 raycast_root(vec3 ro,vec3 rd) {
	float index = f_rootNode;
	float hSize = f_treeSize * 0.5;
	float qSize = f_treeSize * 0.25;
	float finalDepth = 1.0;
	vec3 c = vec3(hSize,hSize,hSize);
	vec4 result = vec4(0,0,0,0.0);
	
	bool ftl = rayToAABB(ro,rd,vec3(0.0,hSize,0.0),vec3(hSize,f_treeSize,hSize));
	bool ftr = rayToAABB(ro,rd,vec3(hSize,hSize,0.0),vec3(f_treeSize,f_treeSize,hSize));
	bool fbl = rayToAABB(ro,rd,vec3(0.0,0.0,0.0),vec3(hSize,hSize,hSize));
	bool fbr = rayToAABB(ro,rd,vec3(hSize,0.0,0.0),vec3(f_treeSize,hSize,hSize));
	bool btl = rayToAABB(ro,rd,vec3(0.0,hSize,hSize),vec3(hSize,f_treeSize,f_treeSize));
	bool btr = rayToAABB(ro,rd,vec3(hSize,hSize,hSize),vec3(f_treeSize,f_treeSize,f_treeSize));
	bool bbl = rayToAABB(ro,rd,vec3(0.0,0.0,hSize),vec3(hSize,hSize,f_treeSize));
	bool bbr = rayToAABB(ro,rd,vec3(hSize,0.0,hSize),vec3(f_treeSize,hSize,f_treeSize));
	
	float ftl_i = getBranchIndex(index    );
	float ftr_i = getBranchIndex(index+1.0);
	float fbl_i = getBranchIndex(index+2.0);
	float fbr_i = getBranchIndex(index+3.0);
	float btl_i = getBranchIndex(index+4.0);
	float btr_i = getBranchIndex(index+5.0);
	float bbl_i = getBranchIndex(index+6.0);
	float bbr_i = getBranchIndex(index+7.0);
	
	vec4 ftl_c = vec4(0.0,0.0,0.0,1.0);
	vec4 ftr_c = vec4(0.0,0.0,0.0,1.0);
	vec4 fbl_c = vec4(0.0,0.0,0.0,1.0);
	vec4 fbr_c = vec4(0.0,0.0,0.0,1.0);
	vec4 btl_c = vec4(0.0,0.0,0.0,1.0);
	vec4 btr_c = vec4(0.0,0.0,0.0,1.0);
	vec4 bbl_c = vec4(0.0,0.0,0.0,1.0);
	vec4 bbr_c = vec4(0.0,0.0,0.0,1.0);
	
	if (ftl && ftl_i > -1.0) ftl_c = raycast_depth_1(ro,rd,vec3(c.x - qSize,c.y + qSize,c.z - qSize),ftl_i);
	if (ftr && ftr_i > -1.0) ftr_c = raycast_depth_1(ro,rd,vec3(c.x + qSize,c.y + qSize,c.z - qSize),ftr_i);
	if (fbl && fbl_i > -1.0) fbl_c = raycast_depth_1(ro,rd,vec3(c.x - qSize,c.y - qSize,c.z - qSize),fbl_i);
	if (fbr && fbr_i > -1.0) fbr_c = raycast_depth_1(ro,rd,vec3(c.x + qSize,c.y - qSize,c.z - qSize),fbr_i);
	if (btl && btl_i > -1.0) btl_c = raycast_depth_1(ro,rd,vec3(c.x - qSize,c.y + qSize,c.z + qSize),btl_i);
	if (btr && btr_i > -1.0) btr_c = raycast_depth_1(ro,rd,vec3(c.x + qSize,c.y + qSize,c.z + qSize),btr_i);
	if (bbl && bbl_i > -1.0) bbl_c = raycast_depth_1(ro,rd,vec3(c.x - qSize,c.y - qSize,c.z + qSize),bbl_i);
	if (bbr && bbr_i > -1.0) bbr_c = raycast_depth_1(ro,rd,vec3(c.x + qSize,c.y - qSize,c.z + qSize),bbr_i);
	
	finalDepth = min( min(min(ftl_c.w,ftr_c.w), min(fbl_c.w,fbr_c.w) ), min(min(btl_c.w,btr_c.w), min(bbl_c.w,bbr_c.w)) );
	
	result.rgb = ftl_c.rgb * float(finalDepth == ftl_c.w)
			   + ftr_c.rgb * float(finalDepth == ftr_c.w)
			   + fbl_c.rgb * float(finalDepth == fbl_c.w)
			   + fbr_c.rgb * float(finalDepth == fbr_c.w)
			   + btl_c.rgb * float(finalDepth == btl_c.w)
			   + btr_c.rgb * float(finalDepth == btr_c.w)
			   + bbl_c.rgb * float(finalDepth == bbl_c.w)
			   + bbr_c.rgb * float(finalDepth == bbr_c.w);
	
	return result;
}

void main() {
	float hAngle = v_cameraAngle.x + atan( ( floor(gl_FragCoord.x) - (v_viewportRes.x - 1.0) * 0.5) / v_projectionDistance.x );
	float vAngle = v_cameraAngle.y + atan( ( floor(gl_FragCoord.y) - (v_viewportRes.y - 1.0) * 0.5) / v_projectionDistance.x );
	gl_FragColor = raycast_root(v_camera.xyz,vec3(sin(hAngle),sin(vAngle),cos(hAngle)));
}