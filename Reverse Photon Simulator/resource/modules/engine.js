/*
	Copyright © 2017 Casey Smalley, All Rights Reserved
	Unauthorized use/modification of this file, via any medium is strictly prohibited
*/

(function(globalNamespace) {
	
	"use strict";
	
	// The purpose of this module is to serve as an interface between regular code and WebGL 2
	
	// Private Logic
	let gl = null;
	let programs = {}; // Containers used as associative data structures (hash tables)
	let textures = {};
	let framebuffers = {};
	let swapchains = {};
	
	// Initialize gl context and set viewport size (uses default values)
	const init = (canvas,width = 640,height = 480) => {
		canvas.width = width;
		canvas.height = height;
		
		// Default anti aliasing isn't going to be of use
		gl = canvas.getContext("webgl2",{antialias: false}); if (!gl) { console.warn("Error: Could not get WebGL 2 context"); return; }
		gl.currentProgram = null;
		gl.currentSwapchain = null;
		gl.clearColor(0.5,0.5,0.5,1.0);
	}
	
	// Create a program that can later be accessed via a key
	const createProgram = (key,vc,fc) => {
		let p = gl.createProgram();
		let v = gl.createShader(gl.VERTEX_SHADER);
		let f = gl.createShader(gl.FRAGMENT_SHADER);
		
		gl.shaderSource(v,vc);
		gl.shaderSource(f,fc);
		gl.compileShader(v);
		gl.compileShader(f);
		
		// Log shader compilation errors
		if (!gl.getShaderParameter(v,gl.COMPILE_STATUS)) { console.warn("Vertex Shader: " + gl.getShaderInfoLog(v)); return; }
		if (!gl.getShaderParameter(f,gl.COMPILE_STATUS)) { console.warn("Fragment Shader: " + gl.getShaderInfoLog(f)); return; }
	
		gl.attachShader(p,v);
		gl.attachShader(p,f);
		gl.linkProgram(p);
		
		// Shader objects no longer needed
		gl.deleteShader(v);
		gl.deleteShader(f);
		
		if (!gl.getProgramParameter(p,gl.LINK_STATUS)) { console.warn("Program Failed To Link: " + gl.getProgramInfoLog(p)); return; }
		
		p.uniforms = {}; // Each program will have its own set of uniform variables (data shared between shaders and javascript)
		
		programs[key] = p; // store program with provided key
	}
	
	// Create a regular GPU texture (RGBA 8 bit integer colour channels to 0-1 floating point);
	const createTexture = (key,image) => {
		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,texture);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,image.width,image.height,0,gl.RGBA,gl.UNSIGNED_BYTE,image);
		gl.bindTexture(gl.TEXTURE_2D,null);
		
		textures[key] = texture;
	}
	
	// Create a GPU integer texture (unsigned channels)
	const createIntegerTexture = (key,image) => {
		let texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,texture);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8UI,image.width,image.height,0,gl.RGBA_INTEGER,gl.UNSIGNED_BYTE,image);
		gl.bindTexture(gl.TEXTURE_2D,null);
		
		textures[key] = texture;
	}
	
	// Create a framebuffer with a colourTexture
	// (A depth texture is skipped since one isn't nessecary)
	const createFramebuffer = (key,width,height) => {
		let framebuffer = gl.createFramebuffer();
		let colourTexture = gl.createTexture();
		
		gl.bindTexture(gl.TEXTURE_2D,colourTexture);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
		
		// Attach colour texture
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,framebuffer);
		gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,colourTexture,0);
		
		gl.bindTexture(gl.TEXTURE_2D,null);
		gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
		
		// Store framebuffer & texture with the prefix _texture (making texture reading of FBO's alot easier)
		framebuffers[key] = framebuffer;
		textures[key + "_texture"] = colourTexture;
	}
	
	// Create list of framebuffer keys to cycle between
	const createSwapchain = (key,keys) => {
		for (let i = 0; i < keys.length; ++i)
			if (framebuffers[keys[i]] === undefined) console.warn("Error: " + keys[i] + " isn't a valid framebuffer");
	
		if (keys.length < 2)
			console.warn("Error: Swapchain must have at least two framebuffers");
	
		swapchains[key] = { keys:keys, currentIndex: 0 };
	}
	
	const INT     = 0;
	const FLOAT   = 1;
	const VEC2    = 2;
	const VEC3    = 3;
	const VEC4    = 4;
	const SAMPLER = 5;
	
	// Add reference to a uniform variable
	// Collections of uniforms differ if a different program is in use (They don't share variables, unless a UBO is in use)
	const addUniform = (type,key) => {
		let uniformLocation = gl.getUniformLocation(gl.currentProgram,key);
		
		if (uniformLocation) {
			uniformLocation.type = type;
			gl.currentProgram.uniforms[key] = uniformLocation;
		} else
			console.warn("Error: uniform " + key + " doesn't exist in the current program");
	}
	
	// Set uniform data
	const setUniform = (key,data) => {
		let uniformLocation = gl.currentProgram.uniforms[key];
		
		if (uniformLocation) {
			switch(uniformLocation.type) {
				case   INT: gl.uniform1i(uniformLocation,data); break;
				case FLOAT: gl.uniform1f(uniformLocation,data); break;
				case  VEC2: gl.uniform2fv(uniformLocation,Float32Array.from(data)); break; // Use of typed arrays is preferred here
				case  VEC3: gl.uniform3fv(uniformLocation,Float32Array.from(data)); break; // so WebGL doesn't need to figure out
				case  VEC4: gl.uniform4fv(uniformLocation,Float32Array.from(data)); break; // and validate the data (to ensure its a 32 bit float)
				case  SAMPLER: gl.uniform1i(uniformLocation,data); break;
			}
		} else
			console.warn("Error: uniform " + key + " doesn't exist in the current program");
	}
	
	// change program
	const useProgram = (key) => {
		let program = programs[key];
		
		if (!program) 
			console.warn("Error: " + key + " isn't a valid program");
		else {
			gl.currentProgram = program;
			gl.useProgram(program);
		}
	}
	
	// Set index of texture residing in GPU memory
	// (WebGL has a limit of ~32 active textures, 
	//  a common workaround is texture atlasing or state switching between textures)
	const useTexture = (key,index) => {
		let texture = textures[key];
		
		if (!texture)
			console.warn("Error: " + key + " isn't a valid texture");
		else {
			gl.activeTexture(gl.TEXTURE0 + index);
			gl.bindTexture(gl.TEXTURE_2D,texture);
			gl.activeTexture(gl.TEXTURE0);
		}
	}
	
	// set framebuffer to render to
	// Provide "null" to render to the canvas instead
	const useFramebuffer = (key) => {
		if (key === "null") {
			gl.bindFramebuffer(gl.FRAMEBUFFER,null);
			return;
		}
		
		let framebuffer = framebuffers[key]
		
		if (framebuffer)
			gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);
		else
			console.warn("Error: " + key + " isn't a valid framebuffer");
	}
	
	// set active swapchain
	const useSwapchain = (key) => {
		let swapchain = swapchains[key];
		
		if (swapchain) {
			gl.currentSwapchain = swapchain;
		} else
			console.warn("Error: " + key + " isn't a valid swapchain");
	}
	
	// Advance down the swapchain to the next framebuffer, if the end has been reached
	// Go back to the beginning
	const advanceSwapchain = () => {
		if (!gl.currentSwapchain)
			console.warn("Error: There is no swapchain in use");
		
		if (gl.currentSwapchain.currentIndex === gl.currentSwapchain.keys.length)
			gl.currentSwapchain.currentIndex = 0;
		
		useFramebuffer(gl.currentSwapchain.keys[gl.currentSwapchain.currentIndex++]);
	}
	
	// Set the colour texture of the current framebuffer in the swapchain to the active texture index
	const useCurrentFramebufferTexture = (index) => {
		if (!gl.currentSwapchain)
			console.warn("Error: There is no swapchain in use");
		
		let currentIndex = gl.currentSwapchain.currentIndex - 1;
		let textureKey = gl.currentSwapchain.keys[currentIndex] + "_texture";
		
		useTexture(textureKey,index);
	}
	
	// Set the colour texture of the previous framebuffer in the swapchain to the active texture index
	// (Can wrap around from the beginning of the chain)
	const usePreviousFramebufferTexture = (index) => {
		if (!gl.currentSwapchain)
			console.warn("Error: There is no swapchain in use");
		
		let currentIndex = gl.currentSwapchain.currentIndex - 2;
		let textureKey = gl.currentSwapchain.keys[(currentIndex < 0) ? gl.currentSwapchain.keys.length - 1 : currentIndex] + "_texture";
		
		useTexture(textureKey,index);
	}
	
	const releaseResources = () => {
		// Release Programs
		let keys = null;
		
		// itterate through named properties of programs
		keys = Object.keys(programs);
		for (let i = 0; i < keys.length; ++i)
			gl.deleteProgram(programs[keys[i]]);
		
		// Release Textures
		keys = Object.keys(textures);
		for (let i = 0; i < keys.length; ++i)
			gl.deleteTexture(textures[keys[i]]);
		
		// Release Framebuffers
		keys = Object.keys(framebuffers);
		for (let i = 0; i < keys.length; ++i)
			gl.deleteFramebuffer(framebuffers[keys[i]]);
		
		// Release context for garbage collection
		gl = null;
	}
	
	// Attach releaseResources as an unload event
	window.onbeforeunload = releaseResources;
	
	// Public Interface
	const publicInterface = {};
	
	publicInterface.init = (canvas,width,height) => init(canvas,width,height);
	publicInterface.clear = () => gl.clear(gl.COLOR_BUFFER_BIT); // Only clear the colour buffer (the depth buffer isn't in use)
	
	publicInterface.createProgram = (key,vc,fc) => createProgram(key,vc,fc);
	publicInterface.createTexture = (key,image) => createTexture(key,image);
	publicInterface.createIntegerTexture = (key,image) => createIntegerTexture(key,image);
	publicInterface.createFramebuffer = (key,width,height) => createFramebuffer(key,width,height);
	publicInterface.createSwapchain = (key,keys) => createSwapchain(key,keys);
	
	publicInterface.useProgram = (key) => useProgram(key);
	publicInterface.useTexture = (key,index) => useTexture(key,index);
	publicInterface.useFramebuffer = (key) => useFramebuffer(key);
	publicInterface.useSwapchain = (key) => useSwapchain(key);
	
	publicInterface.INT     = 0;
	publicInterface.FLOAT   = 1;
	publicInterface.VEC2    = 2;
	publicInterface.VEC3    = 3;
	publicInterface.VEC4    = 4;
	publicInterface.SAMPLER = 5;
	
	publicInterface.addUniform = (type,key) => addUniform(type,key);
	publicInterface.setUniform = (key,data) => setUniform(key,data);
	
	publicInterface.advanceSwapchain = () => advanceSwapchain();
	publicInterface.useCurrentFramebufferTexture = (index) => useCurrentFramebufferTexture(index);
	publicInterface.usePreviousFramebufferTexture = (index) => usePreviousFramebufferTexture(index);
	publicInterface.draw = () => gl.drawArrays(gl.TRIANGLE_STRIP,0,4); // All shaders used require a fullscreen quad
	
	globalNamespace.engine = publicInterface;
	
	globalNamespace.resource.printNotice("Engine.js © Casey Smalley 2017");
	
}(program));