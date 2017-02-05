window.onload = function() {
	// Globals
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	var buffer = document.getElementById("buffer");
	var buffer_context = buffer.getContext("2d");
	var IMAGE_WIDTH = canvas.width;
	var IMAGE_HEIGHT = canvas.height;
	// Classes
	var SphereObsticle = function(x,y,radius) {
		this.x = x;
		this.y = y;
		this.radius = radius;
		
		this.mouseCollision = function(x,y) {
			var xDist = x-this.x;
			var yDist = y-this.y;
			var dist = Math.sqrt(xDist*xDist + yDist*yDist);
			return ( dist < this.radius);
		}
		
		this.mouseScroll = function(delta) {
			this.radius += delta;
		}
		
		this.particleCollision = function(particle,xDist,yDist,dist) {
			xDist = particle[0]-this.x;
			yDist = particle[1]-this.y;
			dist = Math.sqrt(xDist*xDist + yDist*yDist);
			if ( dist < this.radius) {
				xDist /= dist;
				yDist /= dist;
				particle[0] = this.x + this.radius*xDist;
				particle[1] = this.y + this.radius*yDist;
				particle[2] += xDist;
				particle[3] += yDist;
			}
		}
		
		this.render = function() {
			context.fillStyle = "red";
			context.beginPath();
			context.moveTo(this.x,this.y);
			context.arc(this.x,this.y,this.radius,0.0,6.3,false);
			context.fill();
		}
	}
	
	var RectangleObsticle = function(x,y,width,height,angle) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.angle = angle;
		this.topNormal = this.getNormal(this.angle);
		this.rightNormal = this.getNormal(this.angle + 0.5*Math.PI);
		this.bottomNormal = this.getNormal(this.angle + Math.PI);
		this.leftNormal = this.getNormal(this.angle + 1.5*Math.PI);
		
		this.mouseCollision = function(x,y) {
			return this.pointToOBB(x,y,this.x,this.y,this.width,this.height,this.angle)[2];
		}
		
		this.mouseScroll = function(delta) {
			this.angle += delta * 0.05;
			this.topNormal = this.getNormal(this.angle);
			this.rightNormal = this.getNormal(this.angle + 0.5*Math.PI);
			this.bottomNormal = this.getNormal(this.angle + Math.PI);
			this.leftNormal = this.getNormal(this.angle + 1.5*Math.PI);
		}
		
		this.particleCollision = function(particle,xDist,yDist,dist) {
			var hasColided = this.pointToOBB(particle[0],particle[1],this.x,this.y,this.width,this.height,this.angle);
			if (hasColided[2]) {
					particle[0] = hasColided[0];
					particle[1] = hasColided[1];
					particle[2] += this.topNormal[0]/2;
					particle[3] += this.topNormal[1]/2;
			}
		}
		
		this.render = function() {
			context.save();
			context.fillStyle = "red";
			context.translate(this.x,this.y);
			context.rotate(this.angle);
			context.fillRect(-this.width/2,-this.height/2,this.width,this.height);
			context.restore();
		}
	}
	
	RectangleObsticle.prototype.SIDE_UP = 0;
	RectangleObsticle.prototype.SIDE_DOWN = 1;
	RectangleObsticle.prototype.SIDE_LEFT = 2;
	RectangleObsticle.prototype.SIDE_RIGHT = 3;
	
	RectangleObsticle.prototype.getNormal = function(angle) {
		return [Math.sin(angle),-Math.cos(angle)];
	}
	
	RectangleObsticle.prototype.pointToOBB = function(px,py,cx,cy,cw,ch,ca) {
		px -= cx;
		py -= cy;
		var xnew = px * Math.cos(ca) + py * Math.sin(ca) + cx;
		var ynew = px * Math.sin(ca) - py * Math.cos(ca) + cy;
		var hasColided = (xnew > cx - cw/2) && (xnew < cx + cw/2) && (ynew > cy - ch/2) && (ynew < cy + ch/2);
		if (hasColided) {
			ynew = cy + ch/2;
			xnew -= cx;
			ynew -= cy;
			px = xnew * Math.cos(ca) + ynew * Math.sin(ca) + cx;
			py = xnew * Math.sin(ca) - ynew * Math.cos(ca) + cy;
		}
		return [px,py,hasColided];
	}
	
	var ParticleManager = function(y,amount,size) {
		this.y = y;
		this.PARTICLE_COUNT = amount;
		this.PARTICLE_RADIUS = size;
		this.PARTICLE_GRAVITY = 0.1;
		this.PARTICLE_DELAY = 5;
		this.lastBirth = 0;
		this.allSpawned = false;
		this.particles = [];
		this.obsticles = [];
		this.obsticleCount = 0;
		for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
			this.particles.push([IMAGE_WIDTH*0.5+Math.random()*50.0,this.y,Math.random()*2 - 1.0,-Math.random(),false]);
		}
		
		this.addObsticle = function(obsticle) {
			this.obsticles.push(obsticle);
			++this.obsticleCount;
		}
		
		this.nextParticle = function() {
			if (Date.now() - this.lastBirth > this.PARTICLE_DELAY) {
				this.lastBirth = Date.now();
				var particle = null;
				for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
					particle = this.particles[i];
					if (!particle[4]) {
						particle[4] = true;
						return;
					}
				}
				this.allSpawned = true;
			}
		}
		
		this.tick = function() {
			if (!this.allSpawned) this.nextParticle();
		
			var particle = null;
			for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
				particle = this.particles[i];
				if (particle[4]) {
					// Particle Logic
					particle[3] += this.PARTICLE_GRAVITY;
					if (particle[0] < 0 || particle[0] > IMAGE_WIDTH
										|| particle[1] > IMAGE_HEIGHT) {
						particle[0] = IMAGE_WIDTH*0.5+Math.random()*50.0;
						particle[1] = this.y;
						particle[2] = Math.random()*2 - 1.0;
						particle[3] = -Math.random();
					}
					// Collision
					var obsticle = null;
					var xDist = 0;
					var yDist = 0;
					var dist = 0;
					for (var j = 0 ; j < this.obsticleCount ; ++j) {
						this.obsticles[j].particleCollision(particle,xDist,yDist,dist);
					}
					//
					particle[0] += particle[2];
					particle[1] += particle[3];
				}
			}
		}
		
		this.render = function() {
			for (var j = 0 ; j < this.obsticleCount ; ++j) {
				this.obsticles[j].render();
			}
		
			buffer_context.clearRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
			buffer_context.beginPath();
			buffer_context.fillStyle = "cyan";
			var particle = null;
			for (var i = 0 ; i < this.PARTICLE_COUNT ; ++i) {
				particle = this.particles[i];
				buffer_context.moveTo(particle[0],particle[1]);
				buffer_context.arc(particle[0],particle[1],this.PARTICLE_RADIUS,0.0,6.28,false);
			}
			buffer_context.fill();
			var imageData = buffer_context.getImageData(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
			
			for (var i = 0 ; i < imageData.data.length ; i += 4) {
				imageData.data[i] += 0;
				imageData.data[i+1] += 0;
				imageData.data[i+2] += 0;
			}
			
			buffer_context.putImageData(imageData,0,0);
			context.drawImage(buffer,0,0);
		}
	}
	// Object Globals
	var testManager = new ParticleManager(-10,700,5);
	
	testManager.addObsticle(new SphereObsticle(472,485,50));
	//testManager.addObsticle(new SphereObsticle(IMAGE_WIDTH*0.55,300,50));
	//testManager.addObsticle(new SphereObsticle(IMAGE_WIDTH*0.55,300,50));
	testManager.addObsticle(new RectangleObsticle(324,61,200,50,0.3));
	testManager.addObsticle(new RectangleObsticle(506,209,200,50,-0.3));
	testManager.addObsticle(new RectangleObsticle(271,305,200,50,0.45));
	
	var isFollowing = false;
	var followTarget = null;
	
	window.onmousedown = function(e) {
		var bounds = canvas.getBoundingClientRect();
		var x = e.clientX - bounds.left;
		var y = e.clientY - bounds.top;
		isFollowing = !isFollowing;
		if (isFollowing) {
			var hasFound = false;
			for (var i = 0 ; i < testManager.obsticles.length ; ++i) {
				if (testManager.obsticles[i].mouseCollision(x,y)) {
					followTarget = testManager.obsticles[i];
					followTarget.x = x;
					followTarget.y = y;
					hasFound = true;
					break;
				}
			}
			if (!hasFound) isFollowing = false;
		}
	}
	
	window.onmousemove = function(e) {
		var bounds = canvas.getBoundingClientRect();
		var x = e.clientX - bounds.left;
		var y = e.clientY - bounds.top;
		if (isFollowing) {
			followTarget.x = x;
			followTarget.y = y;
		}
	}
	
	window.onwheel = function(e) {
		if (isFollowing) {
			followTarget.mouseScroll(e.deltaY);
		}
	}
	
	var tick = function() {
		testManager.tick();
	}
	
	var render = function() {
		context.fillStyle = "gray";
		context.fillRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
		testManager.render();
	}
	
	var loop = function() {
		tick();
		render();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}