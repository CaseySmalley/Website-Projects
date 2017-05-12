#version 300 es
precision highp float;
precision highp int;
precision highp usampler2D;

/*
	Basic raycasing shader for a compressed sparse voxel octree
	
	It works by using a stack to store the current traversal based on ancestry
	e.g.
		for the SVO [ ][X][ ][ ]
					[ ][ ][ ][ ]
					[ ][ ][ ][ ]
					[ ][ ][ ][ ]
					
	The stack, to the leaf node at X, would be (root node -> top left child -> top right leaf node)
	
	A raycast would work by first pushing the root node to the stack and then performing an ray intersection test with its children
	the algorith would then take the closest intersecting child, see if it contains children of its own (via the childmask) and then push it onto the stack
	
	But if that node's own children don't have intersecting data then the algorith rises out of that node to its parent and checks the closest intersecting sibling for data
	
	this process repeats until either a voxel in a leaf node is found or the list of potential voxel bearing nodes is exhausted
*/

const float FOG_START = 140.0; // Distance to start applying fog
const float FOG_END = 200.0; // Furthest Render Distance
const vec4 FOG_COLOUR = vec4(0.2,0.2,0.2,1.0);
const int MAX_DEPTH = 10; // Maximum possible depth the shader can manage (need to manually increase this for larger trees, < 1024^3 grids)

// Multiply by to convert RGBA8U to regular RGBA
const vec4 TO_FLOAT_RGB = vec4(1.0 / 255.0,1.0 / 255.0,1.0 / 255.0,1.0);

// Offsets that denote the position of child nodes
const vec3 CHILD_OFFSET[8] = vec3[](
	vec3(-0.25, 0.25,-0.25), // Front Top Left
	vec3( 0.25, 0.25,-0.25), // Front Top Right
	vec3(-0.25,-0.25,-0.25), // Front Bottom Left
	vec3( 0.25,-0.25,-0.25), // Front Bottom Right
	vec3(-0.25, 0.25, 0.25), // Back Top Left
	vec3( 0.25, 0.25, 0.25), // Back Top Right
	vec3(-0.25,-0.25, 0.25), // Back Bottom Left
	vec3( 0.25,-0.25, 0.25) // Back Bottom Right
);

// Storage of decoded nodes on the stack
struct Node {
	uint rawChildMask; // Unmodified childmask
	uint childMask; // Childmask that holds unchecked children
	float childPointer;
	vec3 pos; // 3D position of node center
};

struct Child {
	float distance; // (tMin)
	float index; // Position in texture memory, relative to parent childPointer
	float id; // Spacial ID (1-7, for use with CHILD_OFFSET)
	uint  mask; // child AND mask (1 2 4 8 16, ect)
};

uniform float 	   f_treeSize; // Root node size in 3D space
uniform int 	   i_maxDepth; // Maximum tree depth

uniform vec2	   v_treeTextureSize;
uniform usampler2D s_treeTexture;

flat   in vec3 v_start; // Top Left Pixel Ray Direction
flat   in vec3 v_end; // Bottom Right Pixel Ray Direction
flat   in vec3 v_rayOrigin;
smooth in vec3 v_rayDirection; // Interpolated Ray UV (used to lerp between v_start and v_end)
out vec4 v_colour; // final colour output

vec3 v_origin;
vec3 v_direction;
vec3 v_pos;
Node[MAX_DEPTH] nodeStack; // Stack of nodes to hold traversal history (root->parent->child)
Node currentNode; // Stores node currently popped off the stack
Child closestChild; // Used to hold the closest intersecting child to the ray
int currentDepth; // Index value for nodeStack
float currentSize; // current tree size
float hCurrentSize; // half current tree size (to avoid repetative calculations)
float nextChildIndex; // Used to hold the relative index of child nodes that are siblings

// Sample tree based on index (the same index it would have in JavaScript)
uvec4 sampleTree(float index) {
	return texture(s_treeTexture,vec2(
		(mod(index,v_treeTextureSize.x) + 0.5) / v_treeTextureSize.x,
		(floor(index / v_treeTextureSize.x) + 0.5) / v_treeTextureSize.y
	));
}

// Ray to AABB Intersection Detection
//-----------------------------------------------------------------
bool rayToAABB_bool(vec3 cMin,vec3 cMax) {	
	float txMin = (cMin.x - v_origin.x) * v_direction.x;
	float txMax = (cMax.x - v_origin.x) * v_direction.x;
	float tyMin = (cMin.y - v_origin.y) * v_direction.y;
	float tyMax = (cMax.y - v_origin.y) * v_direction.y;
	float tzMin = (cMin.z - v_origin.z) * v_direction.z;
	float tzMax = (cMax.z - v_origin.z) * v_direction.z;
	float tMin = max(min(txMin,txMax),max(min(tyMin,tyMax),min(tzMin,tzMax)));
	float tMax = min(max(txMin,txMax),min(max(tyMin,tyMax),max(tzMin,tzMax)));
	
	return tMax > 0.0 && tMin < tMax;
}

// Returns a distance value if hit
// Otherwise returns 0
float rayToAABB(vec3 cMin,vec3 cMax) {	
	float txMin = (cMin.x - v_origin.x) * v_direction.x;
	float txMax = (cMax.x - v_origin.x) * v_direction.x;
	float tyMin = (cMin.y - v_origin.y) * v_direction.y;
	float tyMax = (cMax.y - v_origin.y) * v_direction.y;
	float tzMin = (cMin.z - v_origin.z) * v_direction.z;
	float tzMax = (cMax.z - v_origin.z) * v_direction.z;
	float tMin = max(min(txMin,txMax),max(min(tyMin,tyMax),min(tzMin,tzMax)));
	float tMax = min(max(txMin,txMax),min(max(tyMin,tyMax),max(tzMin,tzMax)));
	
	// Performs functionally similar comparisons to function above
	return clamp(sign(tMax),0.0,1.0) * clamp(sign(tMax - tMin),0.0,1.0) * tMin;
}
//-----------------------------------------------------------------
// Nodestack functions
//-----------------------------------------------------------------
void pushFromTree(float index) {
	// Retreive and decode node from tree before pushing onto the stack
	uvec4 node = sampleTree(index);
	nodeStack[currentDepth].rawChildMask = node.r;
	nodeStack[currentDepth].childMask = node.r;
	nodeStack[currentDepth].childPointer = float((node.g << 16) | (node.b << 8) | node.a);
	nodeStack[currentDepth].pos = v_pos + CHILD_OFFSET[int(closestChild.id)] * currentSize;
	++currentDepth;
}

void pushNode(Node n) {
	// Push existing node onto the stack
	nodeStack[currentDepth].rawChildMask = n.rawChildMask;
	nodeStack[currentDepth].childMask = n.childMask;
	nodeStack[currentDepth].childPointer = n.childPointer;
	nodeStack[currentDepth].pos = n.pos;
	++currentDepth;
}

void popNode() {
	--currentDepth;
	currentNode.rawChildMask = nodeStack[currentDepth].rawChildMask;
	currentNode.childMask = nodeStack[currentDepth].childMask;
	currentNode.childPointer = nodeStack[currentDepth].childPointer;
	currentNode.pos = nodeStack[currentDepth].pos;
}
//-----------------------------------------------------------------
// Child functions
//-----------------------------------------------------------------
// Set closestChild var if the distance is smaller BUT NOT ZERO!
// Multiply closer with a greater than zero check (1.0 if not zero)
void checkIfCloser(float id,uint mask,float distance) {
	float hasData = float(clamp(currentNode.rawChildMask & mask,0u,1u)); // If the child does actually contain data
	// (distance < closestChild.distance) && distance > 0 && hasData && Has not already been checked
	float closer = clamp(sign(closestChild.distance - distance),0.0,1.0) * sign(distance) * float(clamp( (currentNode.rawChildMask & mask) & (currentNode.childMask & mask),0u,1u));;
	
	// Change or don't change properties based on closer value
	closestChild.distance = mix(closestChild.distance,distance,closer);
	closestChild.index = mix(closestChild.index,nextChildIndex,closer);
	closestChild.id = mix(closestChild.id,id,closer);
	closestChild.mask = closestChild.mask * (1u - uint(closer)) + mask * uint(closer);
	nextChildIndex = nextChildIndex + hasData; // increment nextChildIndex if the current child does contain data
}
//-----------------------------------------------------------------

void main() {
	v_origin = v_rayOrigin;
	v_direction = 1.0 / mix(v_start,v_end,v_rayDirection); // Interpolate ray direction and pre-devide for ray to AABB calculations
	v_colour = FOG_COLOUR;
	
	float distance = 0.0;
	
	// Only perform a proper raycast if the root is being intersected
	if (rayToAABB_bool(vec3(0.0,0.0,0.0),vec3(f_treeSize,f_treeSize,f_treeSize))) {
		// Push root node onto stack
		pushFromTree(0.0);
		nodeStack[0].pos = vec3(0.5 * f_treeSize,0.5 * f_treeSize,0.5 * f_treeSize);
		
		while(currentDepth > 0) { // Loop will terminate when stack is empty
								  // (Stack is reduced to being empty if no voxels are intersected)
			popNode();
			v_pos = currentNode.pos;
			
			currentSize = f_treeSize * pow(0.5,float(currentDepth));
			hCurrentSize = currentSize * 0.5;
			
			// Get closest Child
			closestChild.index = -1.0;
			closestChild.distance = FOG_END;
			closestChild.id = -1.0;
			nextChildIndex = 1.0;
			
			// If any child node intersects with the ray and contains voxel data and hasn't already been visited
			// closestChild will be set to have that Child's properties
			checkIfCloser(0.0,1u,rayToAABB(v_pos + vec3(-hCurrentSize,hCurrentSize,-hCurrentSize),v_pos));
			checkIfCloser(1.0,2u,rayToAABB(v_pos + vec3( hCurrentSize,hCurrentSize,-hCurrentSize),v_pos));
			checkIfCloser(2.0,4u,rayToAABB(v_pos + vec3(-hCurrentSize,0.0,-hCurrentSize),v_pos + vec3(0.0,-hCurrentSize,0.0)));
			checkIfCloser(3.0,8u,rayToAABB(v_pos + vec3( hCurrentSize,0.0,-hCurrentSize),v_pos + vec3(0.0,-hCurrentSize,0.0)));
			checkIfCloser(4.0,16u,rayToAABB(v_pos + vec3(-hCurrentSize,hCurrentSize,0.0),v_pos + vec3(0.0,0.0,hCurrentSize)));
			checkIfCloser(5.0,32u,rayToAABB(v_pos + vec3( hCurrentSize,hCurrentSize,0.0),v_pos + vec3(0.0,0.0,hCurrentSize)));
			checkIfCloser(6.0,64u,rayToAABB(v_pos + vec3(-hCurrentSize,0.0,0.0),v_pos + vec3(0.0,-hCurrentSize,hCurrentSize)));
			checkIfCloser(7.0,128u,rayToAABB(v_pos + vec3( hCurrentSize,0.0,0.0),v_pos + vec3(0.0,-hCurrentSize,hCurrentSize)));
			
			if (currentDepth < i_maxDepth) {
				// Branch Node
				if (closestChild.id > -1.0) {
					// If intersecting with an unvisited child that contains data
					currentNode.childMask = currentNode.childMask ^ closestChild.mask; // remove child's flag from parent's childmask so it can't be visited more then once
					pushNode(currentNode); // push root node to stack
					pushFromTree(currentNode.childPointer + (closestChild.index - 1.0)); // push child to stack
				}	
			} else if (closestChild.id > -1.0) {
				// If Leaf Node contains data
				distance = closestChild.distance;
				v_colour = vec4(sampleTree(currentNode.childPointer + (closestChild.index - 1.0))) * TO_FLOAT_RGB;
				break; // Closest intersecting voxel has been found can terminate loop
			}
		}
		
		// Hide Render Distance Behind Fog
		float factor = clamp((FOG_END - distance) / (FOG_END - FOG_START),0.0,1.0);
		v_colour = mix(FOG_COLOUR,v_colour,factor);
	}
}