window.onload = function() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	IMAGE_WIDTH = 1200;
	IMAGE_HEIGHT = 800;
	canvas.width = IMAGE_WIDTH;
	canvas.height = IMAGE_HEIGHT;
	mouseX = 0;
	mouseY = 0;
	attract = false;
	turning = false;
	currentAngle = 3.14*0.5;
	
	var emitters = [];
	
	addEmitter = function(x,y,amount,colour) {
		emitters.push(new ParticleManager(x,y,amount,colour));
	}
	
	var gradient = Math.random();
	addEmitter(IMAGE_WIDTH*0.5,IMAGE_HEIGHT*0.5,500,[parseInt(0*gradient),parseInt(0*gradient),parseInt(255*gradient)]);
	
	gradient = Math.random();
	addEmitter(IMAGE_WIDTH*0.2,IMAGE_HEIGHT*0.5,500,[parseInt(255*gradient),parseInt(0*gradient),parseInt(255*gradient)]);
	
	gradient = Math.random();
	addEmitter(IMAGE_WIDTH*0.8,IMAGE_HEIGHT*0.5,500,[parseInt(0*gradient),parseInt(255*gradient),parseInt(0*gradient)]);
	
	window.onmousemove = function(e) {
		var bounds = canvas.getBoundingClientRect();
		mouseX = e.clientX - bounds.left;
		mouseY = e.clientY - bounds.top;
	}
	
	window.onmousedown = function(e) {
		attract = true;
	}
	
	window.onmouseup = function() {
		attract = false;
	}
	
	var tick = function() {
		if (turning) currentAngle += 0.05;
		if (currentAngle > 6.28) currentAngle = 0;
		
		emitters[1].emitterX = (IMAGE_WIDTH*0.5) + Math.sin(currentAngle) * 350;
		emitters[1].emitterY = (IMAGE_HEIGHT*0.5) + Math.cos(currentAngle) * 350;
		
		emitters[2].emitterX = (IMAGE_WIDTH*0.5) + Math.sin(currentAngle + 3.14) * 350;
		emitters[2].emitterY = (IMAGE_HEIGHT*0.5) + Math.cos(currentAngle + 3.14) * 350;
		
		for (var i = 0 ; i < emitters.length ; ++i) {
			emitters[i].tick();
		}
	}
	
	var render = function() {
		context.fillStyle = "gray";
		context.fillRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
		
		for (var i = 0 ; i < emitters.length ; ++i) {
			emitters[i].render(canvas,context);
		}
	}

	var loop = function() {
		tick();
		render();
		requestAnimationFrame(loop);
	}
	
	requestAnimationFrame(loop);
}

function ParticleManager(x,y,amount,colour) {
	this.GRAVITY = 0.05;
	this.PARTICLE_COUNT = amount;
	this.PARTICLE_RADIUS = 100;
	this.PARTICLE_X_SPREAD = 4.0;
	this.PARTICLE_Y_SPREAD = -6.0;
	this.particles = [];
	this.emitterX = x;
	this.emitterY = y;
	
	this.particleImg = new Image(this.PARTICLE_RADIUS,this.PARTICLE_RADIUS);
	this.particleInnerImg = new Image(this.PARTICLE_RADIUS,this.PARTICLE_RADIUS);
	this.particleOuterImg = new Image(this.PARTICLE_RADIUS,this.PARTICLE_RADIUS);
	
	var tCanvas = document.createElement("canvas");
	var tContext = tCanvas.getContext("2d");
	
	var imageSize = this.PARTICLE_RADIUS;
	tContext.clearRect(0,0,imageSize,imageSize);
	tContext.drawImage(document.getElementById("particleInnerImg"),0,0,imageSize,imageSize);
	var imageData = tContext.getImageData(0,0,imageSize,imageSize);
	var data = imageData.data;
	for (var i = 0 ; i < data.length ; i += 4) {
		data[i]   = Math.min(Math.max(parseInt(colour[0] * 1.4), 1), 255); // R
		data[i+1] = Math.min(Math.max(parseInt(colour[1] * 1.4), 1), 255); // G
		data[i+2] = Math.min(Math.max(parseInt(colour[2] * 1.4), 1), 255); // B
	}
	tContext.putImageData(imageData,0,0);
	this.particleInnerImg.src = tCanvas.toDataURL();
	
	tContext.clearRect(0,0,imageSize,imageSize);
	tContext.drawImage(document.getElementById("particleImg"),0,0,imageSize,imageSize);
	var imageData = tContext.getImageData(0,0,imageSize,imageSize);
	var data = imageData.data;
	for (var i = 0 ; i < data.length ; i += 4) {
		data[i]   = colour[0]; // R
		data[i+1] = colour[1]; // G
		data[i+2] = colour[2]; // B
	}
	tContext.putImageData(imageData,0,0);
	this.particleImg.src = tCanvas.toDataURL();
	
	tContext.clearRect(0,0,imageSize,imageSize);
	tContext.drawImage(document.getElementById("particleOuterImg"),0,0,imageSize,imageSize);
	var imageData = tContext.getImageData(0,0,imageSize,imageSize);
	var data = imageData.data;
	for (var i = 0 ; i < data.length ; i += 4) {
		data[i]   = parseInt(colour[0] * 0.3); // R
		data[i+1] = parseInt(colour[1] * 0.3); // G
		data[i+2] = parseInt(colour[2] * 0.3); // B
	}
	tContext.putImageData(imageData,0,0);
	this.particleOuterImg.src = tCanvas.toDataURL();
	
	// [ X, Y, DX, DY, Alpha ]
	for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
		this.particles.push(
			[this.emitterX,this.emitterY,(Math.random() * this.PARTICLE_X_SPREAD) - this.PARTICLE_X_SPREAD*0.5,-0.25 + Math.random() * this.PARTICLE_Y_SPREAD,1.0 * Math.random()]
		);
	}
	
	this.tick = function() {
		var particle = null;
		for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {		
			particle = this.particles[i];
			
			if (attract) {
				particle[2] += (particle[0] - mouseX)*0.003;
				particle[3] += (particle[1] - mouseY)*0.003;
			}
			
			particle[4] -= 0.05 * Math.random();
			particle[0] += particle[2];
			particle[1] += particle[3];
			if (particle[4] < 0.0) {
				particle[0] = this.emitterX;
				particle[1] = this.emitterY;
				particle[2] = (Math.random() * this.PARTICLE_X_SPREAD) - this.PARTICLE_X_SPREAD*0.5;
				particle[3] =  -0.25 + Math.random() * this.PARTICLE_Y_SPREAD;
				particle[4] = 1.0;
			}
		}
	}
	
	this.render = function(canvas,context) {
		var particle = null;
		for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
			particle = this.particles[i];
			context.globalAlpha = particle[4];
			if (context.globalAlpha > 0.7)
				context.drawImage(this.particleInnerImg,particle[0]-this.PARTICLE_RADIUS/2,particle[1]-this.PARTICLE_RADIUS/2);
			else if (context.globalAlpha > 0.55)
				context.drawImage(this.particleImg,particle[0]-this.PARTICLE_RADIUS/2,particle[1]-this.PARTICLE_RADIUS/2);
			else
				context.drawImage(this.particleOuterImg,particle[0]-this.PARTICLE_RADIUS/2,particle[1]-this.PARTICLE_RADIUS/2);
		}
		context.globalAlpha = 1.0;
	}
}








