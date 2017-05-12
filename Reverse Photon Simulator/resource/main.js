/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

(function() {
	
	"use strict";
	
	// Module Handles
	let resource = program.resource;
	let mortonNumber = null;
	let octree = null;
	let engine = null;
	
	// Module Import
	resource.import(resource.SCRIPT,"resource/modules/mortonNumber.js");
	resource.import(resource.SCRIPT,"resource/modules/octree.js");
	resource.import(resource.SCRIPT,"resource/modules/engine.js");
	
	// Voxel Model Import
	resource.import(resource.TEXT,"teapot 32","resource/models/teapot x32.json");
	resource.import(resource.TEXT,"teapot 64","resource/models/teapot x64.json");
	resource.import(resource.TEXT,"teapot 128","resource/models/teapot x128.json");
	resource.import(resource.TEXT,"angel 32","resource/models/angel x32.json");
	resource.import(resource.TEXT,"angel 64","resource/models/angel x64.json");
	resource.import(resource.TEXT,"angel 128","resource/models/angel x128.json");
	resource.import(resource.TEXT,"dragon 32","resource/models/dragon x32.json");
	resource.import(resource.TEXT,"dragon 64","resource/models/dragon x64.json");
	resource.import(resource.TEXT,"dragon 128","resource/models/dragon x128.json");
	resource.import(resource.TEXT,"monkey 32","resource/models/monkey x32.json");
	resource.import(resource.TEXT,"monkey 64","resource/models/monkey x64.json");
	resource.import(resource.TEXT,"monkey 128","resource/models/monkey x128.json");
	resource.import(resource.TEXT,"rabbit 32","resource/models/rabbit x32.json");
	resource.import(resource.TEXT,"rabbit 64","resource/models/rabbit x64.json");
	resource.import(resource.TEXT,"rabbit 128","resource/models/rabbit x128.json");
	
	// Shader Import
	resource.import(resource.TEXT,"Basic_Raycast_V","resource/shaders/basic_raycast.vert");
	resource.import(resource.TEXT,"Basic_Raycast_F","resource/shaders/basic_raycast.frag");
	resource.import(resource.TEXT,"PPFullscreen","resource/shaders/PPFullscreen.vert");
	resource.import(resource.TEXT,"PP_Copy","resource/shaders/PP_Copy.frag");
	resource.import(resource.TEXT,"PP_Dithering","resource/shaders/PP_Dithering.frag");
	resource.import(resource.TEXT,"PP_FXAA","resource/shaders/PP_FXAA.frag");
	
	// App Variables
	const imageWidth = 640;
	const imageHeight = 480;
	let software_canvas = null;
	let hardware_canvas = null;
	let fov = 60.0 * (Math.PI / 180.0);
	let ctx = null;
	let softwareRendering = false;
	let FXAA = false;
	let dithering = false;
	
	let currentModel = 0;
	let currentQuality = "low";
	let nextFrame = 0;
	
	let isTransitioning = 0;
	let transitionAngle = 0.0;
	let nextDirection = "";
	
	let auto = 0;
	
	let treeSize = 100;
	let camera = {
		x: 0.0,
		y: 35.0,
		z: 0.0,
		hAngle: 0.0,
		vAngle: 0.0,
		rotation: 0.0,
		toShader() { return [this.x,this.y,this.z,this.hAngle]; }
	}
	
	let models = null;
	
	const setupModel = (id) => {
		let model = {
			
			id: id,
			
			low: {
				tree: octree.generateSparseTree(octree.convertJSONModel(resource.getText(id + " 32"))),
				img: null
			},
			
			med: {
				tree: octree.generateSparseTree(octree.convertJSONModel(resource.getText(id + " 64"))),
				img: null
			},
			
			high: {
				tree: octree.generateSparseTree(octree.convertJSONModel(resource.getText(id + " 128"))),
				img: null
			}
		};
		
		model.low.img = octree.prepareForTexture(model.low.tree);
		model.med.img = octree.prepareForTexture(model.med.tree);
		model.high.img = octree.prepareForTexture(model.high.tree);
		
		return model;
	}
	
	const autoSwitch = () => {
		
		switch(auto) {
			case 0: switchQuality("low"); break;
			case 1: switchQuality("med"); break;
			case 2: switchQuality("high"); break;
			case 3: transitionModel("."); auto = -1; break;
		}
		
		++auto;
		setTimeout(autoSwitch,7000);
	}
	
	resource.onload = () => {
		// Set Handles
		mortonNumber = program.mortonNumber;
		octree = program.octree;
		engine = program.engine;
		
		// Build Models
		models = [
			setupModel("teapot"),
			setupModel("angel"),
			setupModel("dragon"),
			setupModel("monkey"),
			setupModel("rabbit")
		];
		
		// Retreive canvas references
		software_canvas = document.getElementById("software_canvas");
		hardware_canvas = document.getElementById("hardware_canvas");
		
		// Hide canvas
		software_canvas.style.display = "none";
		
		// Setup for software/hardware rendering
		software_setup();
		hardware_setup();
		
		setTimeout(autoSwitch,3000);
	}
	
	const switchModel = (direction) => {
		//cancelAnimationFrame(nextFrame);
		
		switchQuality("low");
		
		switch(direction) {
			case ",": // Left
				if (--currentModel < 0) currentModel = models.length - 1;
			break;
			
			case ".": // Right
				if (++currentModel > models.length - 1) currentModel = 0;
			break;
		}
		
		let current = models[currentModel][currentQuality];
		
		engine.useProgram("Basic_Raycast");
		engine.setUniform("i_maxDepth",current.tree.maxDepth - 1);
		engine.setUniform("v_treeTextureSize",[current.img.width,current.img.height]);
		engine.useTexture(models[currentModel].id + "_" + currentQuality + "_texture",0);
		
		//if (softwareRendering)
		//	nextFrame = requestAnimationFrame(software_loop);
		//else
		//	nextFrame = requestAnimationFrame(hardware_loop);
	}
	
	const switchQuality = (newQuality) => {
		//cancelAnimationFrame(nextFrame);
		
		currentQuality = newQuality;
		
		let current = models[currentModel][currentQuality];
		
		engine.useProgram("Basic_Raycast");
		engine.setUniform("i_maxDepth",current.tree.maxDepth - 1);
		engine.setUniform("v_treeTextureSize",[current.img.width,current.img.height]);
		engine.useTexture(models[currentModel].id + "_" + currentQuality + "_texture",0);
		
		//if (softwareRendering)
		//	nextFrame = requestAnimationFrame(software_loop);
		//else
		//	nextFrame = requestAnimationFrame(hardware_loop);
	}
	
	const transitionModel = (direction) => {
		if (!isTransitioning) {
			isTransitioning = 1;
			transitionAngle = 0.0;
			nextDirection = direction;
		}
	}
	
	window.onkeydown = (e) => {
		switch(e.key) {
			case ",": transitionModel(","); break;
			case ".": transitionModel("."); break;
			case "1": switchQuality("low"); break;
			case "2": switchQuality("med"); break;
			case "3": switchQuality("high"); break;
			
			// Toggle post processing
			case "0": dithering = !dithering; break;
			case "-": FXAA = !FXAA; break;
			case "=":
				// Toggle between software & hardware rendering
				cancelAnimationFrame(nextFrame);
				softwareRendering = !softwareRendering; 
				
				// Hide/display active or inactive canvas (Using a CSS property)
				if (softwareRendering) {
					software_canvas.style.display = "block";
					hardware_canvas.style.display = "none";
				} else {
					hardware_canvas.style.display = "block";
					software_canvas.style.display = "none";
				}
				
				if (softwareRendering)
					nextFrame = requestAnimationFrame(software_loop);
				else
					nextFrame = requestAnimationFrame(hardware_loop);
			break;
		}
	}
	
	//---------------------------------------------------------------------
	// SOFTWARE RENDERING
	//---------------------------------------------------------------------
	const software_setup = () => {
		software_canvas = document.getElementById("software_canvas");
		ctx = software_canvas.getContext("2d");
		software_canvas.width = imageWidth;
		software_canvas.height = imageHeight;
		
		//nextFrame = requestAnimationFrame(software_loop);
	}
	
	const software_loop = () => {
		// Tick
		
		// Rotate camera around the center of the current tree
		camera.rotation = (camera.rotation > 2*Math.PI) ? 0.0 : camera.rotation + 0.05;
		camera.x = treeSize * 0.5 + Math.sin(camera.rotation) * 150;
		camera.z = treeSize * 0.5 + Math.cos(camera.rotation) * 150;
		
		// Face camera towards tree
		camera.hAngle = Math.atan2(
			treeSize * 0.5 - camera.x,
			treeSize * 0.5 - camera.z
		);
		
		switch(isTransitioning) {
			case 1:
				transitionAngle += 0.05;
				switch(nextDirection) {
					case ".":
						camera.x += (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z += (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
					
					case ",":
						camera.x -= (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z -= (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
				}
				
				if (transitionAngle > Math.PI) {
					isTransitioning = 2;	
					transitionAngle = Math.PI;
					switchModel(nextDirection);
				}
			break;
			
			case 2:
				transitionAngle -= 0.05;
				switch(nextDirection) {
					case ".":
						camera.x -= (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z -= (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
					
					case ",":
						camera.x += (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z += (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
				}
				
				if (transitionAngle < 0.0) {
					isTransitioning = 0;
					transitionAngle = 0.0;
				}
			break;
		}
		
		// Render
		ctx.fillStyle = "gray";
		ctx.fillRect(0,0,imageWidth,imageHeight);
		
		ctx.fillStyle = "black";
		
		let hAngleInc = fov / imageWidth;
		let vAngleInc = fov / imageHeight;
		let hAngle = camera.hAngle + hAngleInc - fov * 0.5;
		let vAngle = -0.5 * fov;
		let current = models[currentModel][currentQuality];
		
		// Perform per pixel raycast
		// (Angles start at the topleft pixel and are incremented each iteration)
		for (let x = 0; x < imageWidth; ++x) {
			for (let y = 0; y < imageHeight; ++y) {
				if (octree.raycastSparseTree(current.tree,camera.x,camera.y,camera.z,hAngle,vAngle))
					ctx.fillRect(x,y,1,1);
				
				vAngle += vAngleInc;
			}
			vAngle = -0.5 * fov;
			hAngle += hAngleInc;
		}
		//
		nextFrame = requestAnimationFrame(software_loop);
	}
	
	//---------------------------------------------------------------------
	// HARDWARE RENDERING
	//---------------------------------------------------------------------
	
	const hardware_setup = () => {
		engine.init(hardware_canvas,imageWidth,imageHeight);
		
		engine.createFramebuffer("f_1",imageWidth,imageHeight);
		engine.createFramebuffer("f_2",imageWidth,imageHeight);
		engine.createSwapchain("primary_swapchain",["f_1","f_2"]);
		
		// Upload SVO's
		for (let i = 0; i < models.length; ++i) {
			engine.createIntegerTexture(models[i].id+"_low_texture",models[i].low.img);
			engine.createIntegerTexture(models[i].id+"_med_texture",models[i].med.img);
			engine.createIntegerTexture(models[i].id+"_high_texture",models[i].high.img);
		}
		
		let current = models[0];
	
		// Setup Raycasting States
		engine.createProgram("Basic_Raycast",resource.getText("Basic_Raycast_V"),resource.getText("Basic_Raycast_F"));
		
		// Setup Raycasting uniforms
		engine.useProgram("Basic_Raycast");
		engine.addUniform(engine.VEC4,"v_camera");
		engine.addUniform(engine.FLOAT,"f_treeSize");
		engine.addUniform(engine.INT,"i_maxDepth");
		engine.addUniform(engine.VEC2,"v_treeTextureSize");
		engine.addUniform(engine.SAMPLER,"s_treeTexture");
		engine.setUniform("f_treeSize",treeSize);
		engine.setUniform("i_maxDepth",current.low.tree.maxDepth - 1);
		engine.setUniform("v_treeTextureSize",[current.low.img.width,current.low.img.height]);
		engine.setUniform("s_treeTexture",0);
		
		// Setup Post Processing States
		engine.createProgram("PP_Copy",resource.getText("PPFullscreen"),resource.getText("PP_Copy"));
		engine.createProgram("PP_Dithering",resource.getText("PPFullscreen"),resource.getText("PP_Dithering"));
		engine.createProgram("PP_FXAA",resource.getText("PPFullscreen"),resource.getText("PP_FXAA"));
		
		// Setup Post Processing Uniforms
		engine.useProgram("PP_Copy");
		engine.addUniform(engine.SAMPLER,"s_sceneTexture");
		engine.setUniform("s_sceneTexture",1);
		
		engine.useProgram("PP_Dithering");
		engine.addUniform(engine.SAMPLER,"s_sceneTexture");
		engine.setUniform("s_sceneTexture",1);
		
		engine.useProgram("PP_FXAA");
		engine.addUniform(engine.VEC2,"v_sceneTextureSize");
		engine.addUniform(engine.SAMPLER,"s_sceneTexture");
		engine.setUniform("v_sceneTextureSize",[imageWidth,imageHeight]);
		engine.setUniform("s_sceneTexture",1);
		
		// Set First State
		engine.useProgram("Basic_Raycast");
		
		engine.useTexture("f_1_texture",1);
		engine.useTexture(current.id+"_low_texture",0);
		
		engine.useSwapchain("primary_swapchain");
		
		requestAnimationFrame(hardware_loop);
	}
	
	const hardware_loop = () => {
		// Tick
		camera.rotation = (camera.rotation > 2*Math.PI) ? 0.0 : camera.rotation + 0.01;
		camera.x = treeSize * 0.5 + Math.sin(camera.rotation) * 150;
		camera.z = treeSize * 0.5 + Math.cos(camera.rotation) * 150;
		// Rotate camera around the center of the tree
		
		camera.hAngle = Math.atan2(
			treeSize * 0.5 - camera.x,
			treeSize * 0.5 - camera.z
		);
		// Face camera towards the tree
		
		switch(isTransitioning) {
			case 1:
				transitionAngle += 0.03;
				switch(nextDirection) {
					case ".":
						camera.x += (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z += (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
					
					case ",":
						camera.x -= (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z -= (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
				}
				
				if (transitionAngle > Math.PI) {
					isTransitioning = 2;	
					transitionAngle = Math.PI;
					switchModel(nextDirection);
				}
			break;
			
			case 2:
				transitionAngle -= 0.03;
				switch(nextDirection) {
					case ".":
						camera.x -= (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z -= (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
					
					case ",":
						camera.x += (80 + 80 * -Math.cos(transitionAngle)) * Math.sin(camera.rotation + 0.5 * Math.PI);
						camera.z += (80 + 80 * -Math.cos(transitionAngle)) * Math.cos(camera.rotation + 0.5 * Math.PI);
					break;
				}
				
				if (transitionAngle < 0.0) {
					isTransitioning = 0;
					transitionAngle = 0.0;
				}
			break;
		}
		
		// Render
		
		// Raycasting first pass
		engine.useProgram("Basic_Raycast");
		engine.advanceSwapchain();
		engine.setUniform("v_camera",camera.toShader());
		engine.clear();
		engine.draw();
	
		// Optional post processing passes
		if (FXAA) {
			engine.useProgram("PP_FXAA");
			engine.advanceSwapchain();
			engine.usePreviousFramebufferTexture(1);
			engine.draw();
		}
		
		if (dithering) {
			engine.useProgram("PP_Dithering");
			engine.advanceSwapchain();
			engine.usePreviousFramebufferTexture(1);
			engine.draw();
		}
		
		// copy contents of last use framebuffer to the canvas
		engine.useProgram("PP_Copy");
		engine.useCurrentFramebufferTexture(1);
		engine.useFramebuffer("null");
		engine.draw();
		//
		nextFrame = requestAnimationFrame(hardware_loop);
	}
	
}());