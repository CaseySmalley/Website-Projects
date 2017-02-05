"use strict";

var canvas = null;
var ctx = null;
var imageWidth = 480;
var imageHeight = 480;

var map = [];
var mapSize = 32;

var waveAngle = Math.PI/1.99;
var waveInc = 0.01;
var waveLoopInc = 0.2;
var waveHeight = 8;
var renderScale = 15;
var tree = null;

var animated = true;

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	
	for (var x = 0; x < mapSize; ++x) {
		map[x] = [];
		for (var y = 0; y < mapSize; ++y) {
			map[x][y] = 0;
		}
	}
	
	var loopAngle = waveAngle;
	var currentY = 0;
	for (var x = 0; x < mapSize; ++x) {
		currentY = mapSize/2 + parseInt(Math.cos(loopAngle) * waveHeight);
		for (var y = 0; y < mapSize; ++y) {
			if (y < currentY) 
				map[x][y] = 0;
			else 
				map[x][y] = 1;
		}
		
		loopAngle += waveLoopInc;
	}
	
	tree = buildQuadtree(map);
	
	requestAnimationFrame(loop);
}

// build a linear quadtree
// [x,y,width,height,data,nodeIndex,nodeIndex,nodeIndex,nodeIndex]
var maxDepth = 10;
var nodeLength = 9;

var createNode = function(x,y,width,height,currentIndex,tree,voxelMap,level) {
	// build node
	tree[currentIndex] = x; // X
	tree[currentIndex+1] = y; // Y
	tree[currentIndex+2] = width; // Width
	tree[currentIndex+3] = height; // Height
	tree[currentIndex+4] = -1; // Data
	tree[currentIndex+5] = -1; // ChildIndex
	tree[currentIndex+6] = -1; // ChildIndex
	tree[currentIndex+7] = -1; // ChildIndex
	tree[currentIndex+8] = -1; // ChildIndex
	
	// Determine if its a leaf node
	var xMin = parseInt(x);
	var xMax = parseInt(x+width);
	var yMin = parseInt(y);
	var yMax = parseInt(y+height);
	
	var zeroCount = 0;
	var oneCount = 0;
	var maxCount = 0;
	for (var i = xMin; i < xMax; ++i) {
		for (var j = yMin; j < yMax; ++j) {
			if (voxelMap[i][j])
				++oneCount;
			else
				++zeroCount;
		}
	}
	
	maxCount = zeroCount + oneCount;
	
	if (level < maxDepth) {
		
		if ( oneCount < maxCount && zeroCount < maxCount ) {
			var hwidth = width * 0.5;
			var hheight = height * 0.5;
			var temp = currentIndex;
			
			currentIndex += nodeLength;
			tree[temp+5] = currentIndex; currentIndex = createNode(x,y,hwidth,hheight,currentIndex,tree,voxelMap,level+1);
			tree[temp+6] = currentIndex; currentIndex = createNode(x+hwidth,y,hwidth,hheight,currentIndex,tree,voxelMap,level+1);
			tree[temp+7] = currentIndex; currentIndex = createNode(x,y+hheight,hwidth,hheight,currentIndex,tree,voxelMap,level+1);
			tree[temp+8] = currentIndex; currentIndex = createNode(x+hwidth,y+hheight,hwidth,hheight,currentIndex,tree,voxelMap,level+1);
		} else {
			(zeroCount > oneCount) ? tree[currentIndex+4] = 0 : tree[currentIndex+4] = 1; // Data
			currentIndex += nodeLength;
		}
	
	} else {
		tree[currentIndex+4] = 1; // Data
		currentIndex += nodeLength;
	}
	
	return currentIndex;
}

var buildQuadtree = function(voxelMap) {
	var tree = [];
	var currentIndex = 0;
	createNode(0,0,voxelMap.length,voxelMap[0].length,currentIndex,tree,voxelMap,0);
	return tree;
}

var renderNode = function(index,tree) {
	ctx.rect(tree[index] * renderScale,tree[index+1] * renderScale,tree[index+2] * renderScale,tree[index+3] * renderScale);
	if (tree[index+4] === -1) {
		renderNode(tree[index+5],tree);
		renderNode(tree[index+6],tree);
		renderNode(tree[index+7],tree);
		renderNode(tree[index+8],tree);
	}
}

var renderTree = function(tree) {
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.beginPath();
	renderNode(0,tree);
	ctx.stroke();
}

var loop = function() {
	// tick
	if (animated) {
		waveAngle += waveInc; 
		if (waveAngle > 2*Math.PI) waveAngle = 0;
	
		var loopAngle = waveAngle;
		var currentY = 0;
		for (var x = 0; x < mapSize; ++x) {
			currentY = mapSize/2 + parseInt(Math.cos(loopAngle) * waveHeight);
			for (var y = 0; y < mapSize; ++y) {
				if (y < currentY) 
					map[x][y] = 0;
				else 
					map[x][y] = 1;
			}
		
			loopAngle += waveLoopInc;
		}
	
		tree = null;
		tree = buildQuadtree(map);
	}
	// render
	ctx.fillStyle = "gray";
	ctx.fillRect(0,0,imageWidth,imageHeight);
	
	for (var x = 0; x < map.length; ++x) {
		for (var y = 0; y < map[0].length; ++y) {
			switch(map[x][y]) {
				case 0: ctx.fillStyle = "black"; break;
				case 1: ctx.fillStyle = "gray"; break;
			}
			
			ctx.fillRect(x*renderScale,y*renderScale,renderScale,renderScale);
		}
	}
	
	renderTree(tree);
	
	//
	requestAnimationFrame(loop);
}