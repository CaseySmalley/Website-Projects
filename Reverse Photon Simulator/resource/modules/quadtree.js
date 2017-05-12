/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

(function(globalNamespace) {
	
	"use strict";
	
	// Module used to prototype code that was later adapted in Octree.js
	
	// Private Logic
	
	// Places voxels from an uncompressed 3d array into a single array
	// in Z-order using mortonNumber.js
	const mortonSort2D = (voxelData) => {
		let mortonNumber = program.mortonNumber;
		let mortonCells = [];
		mortonCells.length = voxelData.length * voxelData[0].length;
		
		for (let x = 0; x < voxelData.length; ++x) {
			for (let y = 0; y < voxelData.length; ++y) {
				mortonCells[mortonNumber.encode(mortonNumber._32_BIT_2D,x,y)] = voxelData[y][x];
			}
		}
		
		return mortonCells;
	}
	
	// Factory function for use in generateSparseQuadtree
	const getBuffer = () => ({
		
		data: [undefined,undefined,undefined,undefined],
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
		},
		
		hasData: function() {
			return (
				(this.data[0] !== undefined && this.data[0] !== null && this.data[0] !== 0) ||
				(this.data[1] !== undefined && this.data[1] !== null && this.data[1] !== 0) ||
				(this.data[2] !== undefined && this.data[2] !== null && this.data[2] !== 0) ||
				(this.data[3] !== undefined && this.data[3] !== null && this.data[3] !== 0)
			);
		},
		
		isFull: function() {
			return (this.nextFreeSpace === this.data.length);
		}
		
	});
	
	// Builds a sparse quadtree from a list of voxels sorted into Z-order
	// It works by having a set of buffers (each being four items long)
	// Groups of four voxels are placed into the lowest buffer,
	// if this buffer contains any data (voxels that aren't zero)
	// Those voxels are pushed to an output array and a index to the lowest buffer
	// is pushed to the one above it and is then cleared
	// upper buffers are also pushed and cleared when they become full (and do contain actual data)
	const generateSparseQuadtree = (mortonCells) => {
		let mortonNumber = program.mortonNumber;
		let tree = []; tree.maxDepth = Math.log2(Math.sqrt(mortonCells.length));
		let buffers = []; buffers.length = tree.maxDepth + 1; // add another buffer to store the root node
		let node = null;
		
		for (let i = 0; i < buffers.length; ++i)
			buffers[i] = getBuffer();
		
		for (let i = 0; i< mortonCells.length; i+=4) {
			buffers[0].clear();
			
			// Fill lowest buffer
			buffers[0].add(mortonCells[i]);
			buffers[0].add(mortonCells[i+1]);
			buffers[0].add(mortonCells[i+2]);
			buffers[0].add(mortonCells[i+3]);
			
			// Add to upper buffer if contains data or add empty node (null)
			buffers[0].hasData() ?
				node = [
					(buffers[0].get(0)) ? tree.push(buffers[0].get(0)) - 1: tree.push(-1) - 1,
					(buffers[0].get(1)) ? tree.push(buffers[0].get(1)) - 1: tree.push(-1) - 1,
					(buffers[0].get(2)) ? tree.push(buffers[0].get(2)) - 1: tree.push(-1) - 1,
					(buffers[0].get(3)) ? tree.push(buffers[0].get(3)) - 1: tree.push(-1) - 1
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
							(buffers[j].get(3)) ? tree.push(buffers[j].get(3)[0]) - 1: tree.push(-1) - 1
						]:
						
						node = null;
					
					buffers[j+1].add(node);
					buffers[j].clear();
				}
			}
		}
		
		// Once the loop is over a sparse quadtree is generated
		// The root node exists at the index tree.length - 4
		// And the leaf nodes all exist at the maximum depth (to allow each voxel to be unique)
		return tree;
	}
	
	// Recursively search through a sparse quadtree and print existing data
	const queryNode = (tree,index,depth) => {
		if (index === -1) return; // Early return if an empty branch
		if (tree.length === 0) {
			console.log("Empty Tree");
			return; // Early return incase of an empty tree
		}
		
		console.log(
				"Branch Node\n",
				"Index:",
				index,
				"\n Children:",
				tree[index],
				tree[index+1],
				tree[index+2],
				tree[index+3]
			);
		
		if (depth < tree.maxDepth) {
			++depth;
			
			// Query children if not at max depth
			queryNode(tree,tree[index  ],depth);
			queryNode(tree,tree[index+1],depth);
			queryNode(tree,tree[index+2],depth);
			queryNode(tree,tree[index+3],depth);
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
		}
	}
	
	// A ray to Alix Aligned Bounding Box test
	// It is performed by checking if a ray intersects
	// between the four boundaries
	const rayToAABB = (ox,oy,dx,dy,xMin,xMax,yMin,yMax) => {
		let ddx = 1.0 / dx;
		let ddy = 1.0 / dy;
		let txMin = (xMin - ox) * ddx; 
		let txMax = (xMax - ox) * ddx;
		let tyMin = (yMin - oy) * ddy;
		let tyMax = (yMax - oy) * ddy;
		let tMin = Math.max ( Math.min(txMin,txMax) , Math.min(tyMin,tyMax) );
		let tMax = Math.min ( Math.max(txMin,txMax) , Math.max(tyMin,tyMax) );
		
		return !(tMax < 0 || tMin > tMax) * tMin;
	}
	
	const renderSize = 400;
	
	// Recursive raycasting function that traverses from the top of the tree
	// testing each child in each branch for a collision with the intersecting ray
	// (every single possible child is tested, making it much more flexible for different sizes of trees)
	const raycastNode = (tree,index,x,y,depth,ox,oy,dx,dy) => {
		if (index === -1) return false;
		
		let size = renderSize * Math.pow(0.5,depth - 1);
		let tl = rayToAABB(ox,oy,dx,dy,x - size * 0.5,x,y - size * 0.5,y);
		let tr = rayToAABB(ox,oy,dx,dy,x,x + size * 0.5,y - size * 0.5,y);
		let bl = rayToAABB(ox,oy,dx,dy,x - size * 0.5,x,y,y + size * 0.5);
		let br = rayToAABB(ox,oy,dx,dy,x,x + size * 0.5,y,y + size * 0.5);
		
		if (depth < tree.maxDepth) {
			++depth;
			if (tl) tl = raycastNode(tree,tree[index  ],x - size * 0.25,y - size * 0.25,depth,ox,oy,dx,dy);
			if (tr) tr = raycastNode(tree,tree[index+1],x + size * 0.25,y - size * 0.25,depth,ox,oy,dx,dy);
			if (bl) bl = raycastNode(tree,tree[index+2],x - size * 0.25,y + size * 0.25,depth,ox,oy,dx,dy);
			if (br) br = raycastNode(tree,tree[index+3],x + size * 0.25,y + size * 0.25,depth,ox,oy,dx,dy);
		} else {
			tl *= (tl > 0 && tree[index  ] > 0);
			tr *= (tr > 0 && tree[index+1] > 0);
			bl *= (bl > 0 && tree[index+2] > 0);
			br *= (br > 0 && tree[index+3] > 0);
		}
		
		return tl || tr || bl || br;
	}
	
	// A recurisve rendering function for use with a 2D canvas rendering context
	// Used to test Quadtree functionality
	const renderNode = (tree,index,x,y,depth,ctx) => {
		if (index === -1) return;
		let size = renderSize * Math.pow(0.5,depth - 1);
		
		if (depth < tree.maxDepth) {
			++depth;
			
			renderNode(tree,tree[index  ],x - size * 0.25,y - size * 0.25,depth,ctx);
			renderNode(tree,tree[index+1],x + size * 0.25,y - size * 0.25,depth,ctx);
			renderNode(tree,tree[index+2],x - size * 0.25,y + size * 0.25,depth,ctx);
			renderNode(tree,tree[index+3],x + size * 0.25,y + size * 0.25,depth,ctx);
		} else {
			ctx.fillStyle = "black";
			
			if (tree[index  ] > 0) ctx.fillRect(x - size * 0.5, y - size * 0.5, size * 0.5 - 1, size * 0.5 - 1);
			if (tree[index+1] > 0) ctx.fillRect(x			  , y - size * 0.5, size * 0.5 - 1, size * 0.5 - 1);
			if (tree[index+2] > 0) ctx.fillRect(x - size * 0.5, y			  , size * 0.5 - 1, size * 0.5 - 1);
			if (tree[index+3] > 0) ctx.fillRect(x			  , y			  , size * 0.5 - 1, size * 0.5 - 1);
		}
	}
	
	// Public Interface
	let publicInterface = {};
	
	publicInterface.generateSparseTree = (voxelData) => generateSparseQuadtree( mortonSort2D(voxelData) );
	publicInterface.querySparseTree = (tree) => { console.log("Tree Length: ", tree.length); queryNode(tree,tree.length - 4,1); }
	publicInterface.raycastSparseTree = (tree,px,py,angle) => raycastNode(tree,tree.length - 4,renderSize * 0.5,renderSize * 0.5,1,px,py,Math.sin(angle),-Math.cos(angle));
	publicInterface.renderSparseTree = (tree,ctx) => renderNode(tree,tree.length - 4,renderSize * 0.5,renderSize * 0.5,1,ctx);
	
	globalNamespace.quadtree = publicInterface;
	
	globalNamespace.resource.printNotice("Quadtree.js © Casey Smalley 2017");
	
}(program));