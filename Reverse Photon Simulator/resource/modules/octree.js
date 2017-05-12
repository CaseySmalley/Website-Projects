/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

(function(globalNamespace) {
	
	"use strict";
	
	// Private Logic
	
	// Returns the nearest larger power of two
	const nearestPow2 = (n) => {
		--n;
		n = n | n >> 1;
		n = n | n >> 2;
		n = n | n >> 4;
		n = n | n >> 8;
		n = n | n >> 16;
		return ++n;
	}
	
	const lerp = (v1,v2,t) => v1 * (1.0 - t) + t * v2;
	
	// Convert JSON model to match input data (square 3D array of voxels)
	const convertJSONModel = (rawModel) => {
		let model = JSON.parse(rawModel);
		let size = nearestPow2(Math.max(model.dimension[0].width,model.dimension[0].height,model.dimension[0].depth));
		let out = []; out.length = size;
		
		for (let z = 0; z < size; ++z) {
			out[z] = [];
			out[z].length = size;
			for (let y = 0; y < size; ++y) {
				out[z][y] = [];
				out[z][y].length = size;
				for (let x = 0; x < size; ++x) {
					out[z][y][x] = 0;
				}
			}
		}
		
		let xOffset = ((size / 2) | 0) - (model.dimension[0].width / 2) | 0;
		let yOffset = ((size / 2) | 0) - (model.dimension[0].height / 2) | 0;
		let zOffset = ((size / 2) | 0) - (model.dimension[0].depth / 2) | 0;
		let x = 0;
		let y = 0;
		let z = 0;
		let c = 0;
		
		// Generate random colour for each voxel
		for (let i = 0; i < model.voxels.length; ++i) {
			x = parseInt(model.voxels[i].x);
			y = parseInt(model.voxels[i].y);
			z = parseInt(model.voxels[i].z);
			
			c = ((((x / size) * 255) | 0) << 24
			   | (((y / size) * 255) | 0) << 16
			   | (((z / size) * 255) | 0) << 8) >>> 0;
			
			out[z + zOffset][y + yOffset][x + xOffset] = c;
		}
		
		// returns converted data
		return out;
	}
	
	// Places voxels from an uncompressed 3d array into a single array
	// in Z-order using mortonNumber.js
	const mortonSort3D = (voxelData) => {
		let mortonNumber = program.mortonNumber;
		let mortonCells = []; mortonCells.length = Math.pow(voxelData.length,3);
		let h = 0;
		let l = 0;
		
		for (let x = 0; x < voxelData.length; ++x) {
			for (let y = 0; y < voxelData.length; ++y) {
				for (let z = 0; z < voxelData.length; ++z) {
					[h,l] = mortonNumber.encode(mortonNumber._48_BIT_3D,x,y,z);
					mortonCells[h*4294967295 + l] = voxelData[z][y][x];
				}
			}
		}
		
		return mortonCells;
	}
	
	// Factory function for use in generateSparseOctree
	const getBuffer = () => ({
		
		data: [undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined],
		nextFreeSpace: 0,
		
		add: function(element) {
			if (this.nextFreeSpace === this.data.length) return;
			this.data[this.nextFreeSpace++] = element;
		},
		
		get: function(index) {
			return this.data[index];
		},
		
		clear: function() {
			this.nextFreeSpace = 0;
			this.data[0] = undefined;
			this.data[1] = undefined;
			this.data[2] = undefined;
			this.data[3] = undefined;
			this.data[4] = undefined;
			this.data[5] = undefined;
			this.data[6] = undefined;
			this.data[7] = undefined;
		},
		
		hasData: function() {
			return (
				(this.data[0] !== undefined && this.data[0] !== null && this.data[0] !== 0) ||
				(this.data[1] !== undefined && this.data[1] !== null && this.data[1] !== 0) ||
				(this.data[2] !== undefined && this.data[2] !== null && this.data[2] !== 0) ||
				(this.data[3] !== undefined && this.data[3] !== null && this.data[3] !== 0) ||
				(this.data[4] !== undefined && this.data[4] !== null && this.data[4] !== 0) ||
				(this.data[5] !== undefined && this.data[5] !== null && this.data[5] !== 0) ||
				(this.data[6] !== undefined && this.data[6] !== null && this.data[6] !== 0) ||
				(this.data[7] !== undefined && this.data[7] !== null && this.data[7] !== 0)
			);
		},
		
		isFull: function() {
			return (this.nextFreeSpace === this.data.length);
		}
		
	});
	
	// Builds a sparse octree from a list of voxels sorted into Z-order
	// It works by having a set of buffers (each being eight items long)
	// Groups of eight voxels are placed into the lowest buffer,
	// if this buffer contains any data (voxels that aren't zero)
	// Those voxels are pushed to an output array and a index to the lowest buffer
	// is pushed to the one above it and is then cleared
	// upper buffers are also pushed and cleared when they become full (and do contain actual data)
	const generateSparseOctree = (mortonCells) => {
		let mortonNumber = program.mortonNumber;
		let tree = []; tree.maxDepth = Math.log2(Math.cbrt(mortonCells.length));
		let buffers = []; buffers.length = tree.maxDepth + 1; // add another buffer to store the root node
		let node = null;
		
		for (let i = 0; i < buffers.length; ++i)
			buffers[i] = getBuffer();
		
		for (let i = 0; i< mortonCells.length; i+=8) {
			buffers[0].clear();
			
			// Fill lowest buffer
			buffers[0].add(mortonCells[i]);
			buffers[0].add(mortonCells[i+1]);
			buffers[0].add(mortonCells[i+2]);
			buffers[0].add(mortonCells[i+3]);
			buffers[0].add(mortonCells[i+4]);
			buffers[0].add(mortonCells[i+5]);
			buffers[0].add(mortonCells[i+6]);
			buffers[0].add(mortonCells[i+7]);
			
			// Add to upper buffer if contains data or add empty node (null)
			buffers[0].hasData() ?
				node = [
					(buffers[0].get(0)) ? tree.push(buffers[0].get(0)) - 1: tree.push(-1) - 1,
					(buffers[0].get(1)) ? tree.push(buffers[0].get(1)) - 1: tree.push(-1) - 1,
					(buffers[0].get(2)) ? tree.push(buffers[0].get(2)) - 1: tree.push(-1) - 1,
					(buffers[0].get(3)) ? tree.push(buffers[0].get(3)) - 1: tree.push(-1) - 1,
					(buffers[0].get(4)) ? tree.push(buffers[0].get(4)) - 1: tree.push(-1) - 1,
					(buffers[0].get(5)) ? tree.push(buffers[0].get(5)) - 1: tree.push(-1) - 1,
					(buffers[0].get(6)) ? tree.push(buffers[0].get(6)) - 1: tree.push(-1) - 1,
					(buffers[0].get(7)) ? tree.push(buffers[0].get(7)) - 1: tree.push(-1) - 1
				]:
				
				node = null;
			
			buffers[1].add(node);
			
			// Iterate through all upper buffers, add empty node if it contains no actual data
			for (let j = 1; j < buffers.length - 1; ++j) {
				if (buffers[j].isFull()) {
					(buffers[j].hasData()) ?
						node = [
							(buffers[j].get(0)) ? tree.push(buffers[j].get(0)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(1)) ? tree.push(buffers[j].get(1)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(2)) ? tree.push(buffers[j].get(2)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(3)) ? tree.push(buffers[j].get(3)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(4)) ? tree.push(buffers[j].get(4)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(5)) ? tree.push(buffers[j].get(5)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(6)) ? tree.push(buffers[j].get(6)[0]) - 1: tree.push(-1) - 1,
							(buffers[j].get(7)) ? tree.push(buffers[j].get(7)[0]) - 1: tree.push(-1) - 1
						]:
						
						node = null;
					
					buffers[j+1].add(node);
					buffers[j].clear();
				}
			}
		}
		
		// Once the loop is over a sparse quadtree is generated
		// The root node exists at the index tree.length - 8
		// And the leaf nodes all exist at the maximum depth (to allow each voxel to be unique)
		return tree;
	}
	
	let currentIndex = 0;
	let output = null;
	let depthBuffer = null;
	
	// Recursively work through a sparse tree and build a childmask for each node
	const compactNode = (tree,index,depth) => {
		if (index === -1) return; // Early return for an empty branch
		
		let childMask = 0; // 1 byte flag mask
		
		if (tree[index  ] !== -1) childMask |=   1;
		if (tree[index+1] !== -1) childMask |=   2;
		if (tree[index+2] !== -1) childMask |=   4;
		if (tree[index+3] !== -1) childMask |=   8;
		if (tree[index+4] !== -1) childMask |=  16;
		if (tree[index+5] !== -1) childMask |=  32;
		if (tree[index+6] !== -1) childMask |=  64;
		if (tree[index+7] !== -1) childMask |= 128;
		
		depthBuffer[depth - 1].push((childMask << 24) >>> 0);
		
		if (depth < tree.maxDepth) { // Compact children
			compactNode(tree,tree[index  ],depth + 1);
			compactNode(tree,tree[index+1],depth + 1);
			compactNode(tree,tree[index+2],depth + 1);
			compactNode(tree,tree[index+3],depth + 1);
			compactNode(tree,tree[index+4],depth + 1);
			compactNode(tree,tree[index+5],depth + 1);
			compactNode(tree,tree[index+6],depth + 1);
			compactNode(tree,tree[index+7],depth + 1);
		} else if (depth === tree.maxDepth) {
			if (tree[index  ] !== -1) depthBuffer[tree.maxDepth].push(tree[index  ]);
			if (tree[index+1] !== -1) depthBuffer[tree.maxDepth].push(tree[index+1]);
			if (tree[index+2] !== -1) depthBuffer[tree.maxDepth].push(tree[index+2]);
			if (tree[index+3] !== -1) depthBuffer[tree.maxDepth].push(tree[index+3]);
			if (tree[index+4] !== -1) depthBuffer[tree.maxDepth].push(tree[index+4]);
			if (tree[index+5] !== -1) depthBuffer[tree.maxDepth].push(tree[index+5]);
			if (tree[index+6] !== -1) depthBuffer[tree.maxDepth].push(tree[index+6]);
			if (tree[index+7] !== -1) depthBuffer[tree.maxDepth].push(tree[index+7]);
		}
	}
	
	// Condenses a sparse tree to use less memory, first preperation step for GPU acceleration
	const compactSparseTree = (tree) => {
		output = [];
		output.length = tree.length / 8; // Aprox length of the new tree (Ignoring New Leaf Nodes)
		output.maxDepth = tree.maxDepth;
		
		currentIndex = 0;
		
		// childmasks for branch nodes will be pushed to an array inside of depth buffer, depending on the depth they exist at
		// The purpose is to generate an array of nodes seperated by their depths
		depthBuffer = [];
		depthBuffer.length = tree.maxDepth + 1;
		for (let i = 0; i < depthBuffer.length; ++i) depthBuffer[i] = [];
		
		// Generate child masks
		compactNode(tree,tree.length - 8,1);
		
		let startIndex = 0;
		let currentChildCount = 0;
		let childPointer = 0;
		let childMask = 0;
		
		// Append compacted branch nodes
		for (let i = 0; i < depthBuffer.length - 1; ++i) {
			currentChildCount = 0;
			startIndex = 0;
			for (let j = i; j > -1; --j) startIndex += depthBuffer[j].length;
			
			for (let j = 0; j < depthBuffer[i].length; ++j) {
				childMask = depthBuffer[i][j] >>> 24;
				childPointer = startIndex + currentChildCount; // Contains the index of the first child
															   // (Children are organised into blocks)
			
				if (childMask & 0b00000001) ++currentChildCount;
				if (childMask & 0b00000010) ++currentChildCount;
				if (childMask & 0b00000100) ++currentChildCount;
				if (childMask & 0b00001000) ++currentChildCount;
				if (childMask & 0b00010000) ++currentChildCount;
				if (childMask & 0b00100000) ++currentChildCount;
				if (childMask & 0b01000000) ++currentChildCount;
				if (childMask & 0b10000000) ++currentChildCount;
			
				output[currentIndex++] = (depthBuffer[i][j] | (childPointer & 0xffffff)) >>> 0; // Construct new node
			}
		}
		
		// Append Leaf Nodes (Contain actual voxel data)
		for (let i = 0; i < depthBuffer[tree.maxDepth].length; ++i)
			output[currentIndex++] = depthBuffer[tree.maxDepth][i];
		
		//queryCompactNode(output,0,1);
		return output;
	}
	
	// Recursively query through a compacted tree (used to test compression & data validity)
	const queryCompactNode = (tree,index,depth) => {
		let childPointer = tree[index] & 0b111111111111111111111111;
		let childMask = tree[index] >>> 24;
		let childCount = 0;
		console.log("Branch Node -","ChildPointer: " + childPointer,"Child Mask: " + "0".repeat(8 - childMask.toString(2).length) + childMask.toString(2));
		
		if (depth < tree.maxDepth) {
			if (childMask & 0b00000001) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b00000010) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b00000100) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b00001000) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b00010000) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b00100000) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b01000000) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
			if (childMask & 0b10000000) { queryCompactNode(tree,childPointer + childCount,depth + 1); ++childCount; }
		} else {
			if (childMask & 0b00000001) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b00000010) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b00000100) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b00001000) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b00010000) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b00100000) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b01000000) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
			if (childMask & 0b10000000) { console.log("Leaf Node -",tree[childPointer + childCount]); ++childCount; }
		}
	}
	
	// Recursively query uncompressed tree
	const queryNode = (tree,index,depth) => {
		if (index === -1) return;
		if (tree.length === 0) {
			console.log("Empty Tree");
			return;
		}
		
		console.log(
				"Branch Node\n",
				"Index:",
				index,
				"\n Children:",
				tree[index],
				tree[index+1],
				tree[index+2],
				tree[index+3],
				tree[index+4],
				tree[index+5],
				tree[index+6],
				tree[index+7]
			);
		
		if (depth < tree.maxDepth) {
			++depth;
			
			// Query children if not a leaf node
			queryNode(tree,tree[index  ],depth);
			queryNode(tree,tree[index+1],depth);
			queryNode(tree,tree[index+2],depth);
			queryNode(tree,tree[index+3],depth);
			queryNode(tree,tree[index+4],depth);
			queryNode(tree,tree[index+5],depth);
			queryNode(tree,tree[index+6],depth);
			queryNode(tree,tree[index+7],depth);
		} else {
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+1]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+2]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+3]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+4]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+5]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+6]
			);
			
			console.log(
				"Leaf Node\n",
				"Value:",
				tree[index+7]
			);
		}
	}
	
	// A ray to Alix Aligned Bounding Box test
	// It is performed by checking if a ray intersects
	// between the four boundaries
	const rayToAABB = (ox,oy,oz,dx,dy,dz,xMin,xMax,yMin,yMax,zMin,zMax) => {
		let ddx = 1.0 / dx;
		let ddy = 1.0 / dy;
		let ddz = 1.0 / dz;
		let txMin = (xMin - ox) * ddx;
		let txMax = (xMax - ox) * ddx;
		let tyMin = (yMin - oy) * ddy;
		let tyMax = (yMax - oy) * ddy;
		let tzMin = (zMin - oz) * ddz;
		let tzMax = (zMax - oz) * ddz;
		let tMin = Math.max(Math.min(txMin,txMax),Math.min(tyMin,tyMax),Math.min(tzMin,tzMax));
		let tMax = Math.min(Math.max(txMin,txMax),Math.max(tyMin,tyMax),Math.max(tzMin,tzMax));
		
		return !(tMax <= 0 || tMin >= tMax);
	}
	
	const renderSize = 100;
	
	// Programmed to raycast non compacted sparse trees
	// Recursive raycasting function that traverses from the top of the tree
	// testing each child in each branch for a collision with the intersecting ray
	// (every single possible child is tested, making it much more flexible for different sizes of trees)
	// Used for software rendering
	const raycastNode = (tree,index,x,y,z,depth,ox,oy,oz,dx,dy,dz) => {
		if (index === -1) return false;
		
		let size = renderSize * Math.pow(0.5,depth - 1);
		let hSize = size * 0.5;
		let qSize = size * 0.25;
		
		let ftl = rayToAABB(ox,oy,oz,dx,dy,dz,x - hSize,x,y,y + hSize,z - hSize,z);
		let ftr = rayToAABB(ox,oy,oz,dx,dy,dz,x,x + hSize,y,y + hSize,z - hSize,z);
		let fbl = rayToAABB(ox,oy,oz,dx,dy,dz,x - hSize,x,y - hSize,y,z - hSize,z);
		let fbr = rayToAABB(ox,oy,oz,dx,dy,dz,x,x + hSize,y - hSize,y,z - hSize,z);
		let btl = rayToAABB(ox,oy,oz,dx,dy,dz,x - hSize,x,y,y + hSize,z,z + hSize);
		let btr = rayToAABB(ox,oy,oz,dx,dy,dz,x,x + hSize,y,y + hSize,z,z + hSize);
		let bbl = rayToAABB(ox,oy,oz,dx,dy,dz,x - hSize,x,y - hSize,y,z,z + hSize);
		let bbr = rayToAABB(ox,oy,oz,dx,dy,dz,x,x + hSize,y - hSize,y,z,z + hSize);
		
		if (depth < tree.maxDepth) {
			++depth;
			
			if (ftl) ftl = raycastNode(tree,tree[index  ],x - qSize,y + qSize,z - qSize,depth,ox,oy,oz,dx,dy,dz);
			if (ftr) ftr = raycastNode(tree,tree[index+1],x + qSize,y + qSize,z - qSize,depth,ox,oy,oz,dx,dy,dz);
			if (fbl) fbl = raycastNode(tree,tree[index+2],x - qSize,y - qSize,z - qSize,depth,ox,oy,oz,dx,dy,dz);
			if (fbr) fbr = raycastNode(tree,tree[index+3],x + qSize,y - qSize,z - qSize,depth,ox,oy,oz,dx,dy,dz);
			if (btl) btl = raycastNode(tree,tree[index+4],x - qSize,y + qSize,z + qSize,depth,ox,oy,oz,dx,dy,dz);
			if (btr) btr = raycastNode(tree,tree[index+5],x + qSize,y + qSize,z + qSize,depth,ox,oy,oz,dx,dy,dz);
			if (bbl) bbl = raycastNode(tree,tree[index+6],x - qSize,y - qSize,z + qSize,depth,ox,oy,oz,dx,dy,dz);
			if (bbr) bbr = raycastNode(tree,tree[index+7],x + qSize,y - qSize,z + qSize,depth,ox,oy,oz,dx,dy,dz);
		} else {
			ftl = (ftl && tree[index  ] > 0);
			ftr = (ftr && tree[index+1] > 0);
			fbl = (fbl && tree[index+2] > 0);
			fbr = (fbr && tree[index+3] > 0);
			btl = (btl && tree[index+4] > 0);
			btr = (btr && tree[index+5] > 0);
			bbl = (bbl && tree[index+6] > 0);
			bbr = (bbr && tree[index+7] > 0);
		}
		
		return ftl || ftr || fbl || fbr || btl || btr || bbl || bbr;
	}
	
	const encodeColour = (r,g,b) => {
		return (r & 0b11111111) << 16 |
			   (g & 0b11111111) <<  8 |
			   (b & 0b11111111);
	}
	
	// Simply split each compressed node into four bytes
	const prepareForTexture = (tree) => {
		let size = nearestPow2(Math.ceil(Math.sqrt(tree.length))); // calculate nearest number in the series 2^n that is larger
		let img = new ImageData(size,size);
		let node = 0;
		
		for (let i = 0; i < tree.length; ++i) {
			node = tree[i];
			
			img.data[i*4  ] = ((node >> 24) & 0b11111111) >>> 0; // R
			img.data[i*4+1] = ((node >> 16) & 0b11111111) >>> 0; // G
			img.data[i*4+2] = ((node >>  8) & 0b11111111) >>> 0; // B
			img.data[i*4+3] = ((node	  ) & 0b11111111) >>> 0; // A
		}
		
		return img;
	}
	
	// Public Interface
	let publicInterface = {};
	
	publicInterface.convertJSONModel = (rawModel) => convertJSONModel(rawModel);
	publicInterface.generateSparseTree = (voxelData) => generateSparseOctree( mortonSort3D(voxelData) );
	publicInterface.querySparseTree = (tree) => { console.log("Tree Length: ", tree.length); queryNode(tree,tree.length - 8,1); }
	publicInterface.raycastSparseTree = (tree,ox,oy,oz,hAngle,vAngle) => raycastNode(tree,tree.length - 8,renderSize * 0.5,renderSize * 0.5,renderSize * 0.5,1,ox,oy,oz,Math.sin(hAngle),Math.sin(vAngle),Math.cos(hAngle));
	publicInterface.encodeColour = (r,g,b) => encodeColour(r,g,b);
	publicInterface.prepareForTexture = (tree) => prepareForTexture(compactSparseTree(tree));
	
	globalNamespace.octree = publicInterface;
	
	globalNamespace.resource.printNotice("Octree.js © Casey Smalley 2017");
	
}(program));