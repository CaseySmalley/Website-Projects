var canvas = null;
var ctx = null;
var imageWidth = 640;
var imageHeight = 480;

var player = null;
var asteroids = [];
var asteroidCount = 3;

var debrisManager = null;

// Classes
// ---------------------------------------------
var Debris = function() {
	this.x = 0.0;
	this.y = 0.0;
	this.dx = 0.0;
	this.dy = 0.0;
	this.radius = 0.0;
	this.inUse = false;
}

Debris.prototype.init = function(x,y,angle,speed) {
	this.x = x;
	this.y = y;
	this.dx = Math.sin(angle) * speed;
	this.dy = -Math.cos(angle) * speed;
	this.radius = 2.0 + Math.random() * this.radiusRange;
	this.inUse = true;
}

Debris.prototype.tick = function() {
	this.x += this.dx;
	this.y += this.dy;
	this.inUse = !(this.x < 0 || this.x > imageWidth || this.y < 0 || this.y > imageHeight);
}

Debris.prototype.render = function() {
	ctx.moveTo(this.x + this.radius,this.y);
	ctx.arc(this.x,this.y,this.radius,0,2*Math.PI,false);
}

Debris.prototype.radiusRange = 5.0;

var Projectile = function() {
	this.x = 0.0;
	this.y = 0.0;
	this.dx = 0.0;
	this.dy = 0.0;
	this.inUse = false;
}

Projectile.prototype.init = function(x,y,angle,speed) {
	this.x = x;
	this.y = y;
	this.dx = Math.sin(angle) * speed;
	this.dy = -Math.cos(angle) * speed;
	this.inUse = true;
}

Projectile.prototype.tick = function() {
	this.x += this.dx;
	this.y += this.dy;
	
	var distance = 0;
	for (var i = 0; i < asteroids.length; ++i) {
		distance = 	(this.x - asteroids[i].x)*(this.x - asteroids[i].x) +
					(this.y - asteroids[i].y)*(this.y - asteroids[i].y);
		if (distance < asteroids[i].collisionRadius*asteroids[i].collisionRadius) {
			asteroids[i].split();
			this.inUse = false;
			return;
		}
	}
	
	this.inUse = !(this.x < 0 || this.x > imageWidth || this.y < 0 || this.y > imageHeight);
}

Projectile.prototype.render = function() {
	ctx.moveTo(this.x + this.radius,this.y);
	ctx.arc(this.x,this.y,this.radius,0,2*Math.PI,false);
}

Projectile.prototype.radius = 4;

var ParticleManager = function(particle,maxParticles) {
	this.particles = [];
	this.particleCount = maxParticles;
	
	for (var i = 0; i < maxParticles; ++i) {
		this.particles[i] = new particle();
	}
}

ParticleManager.prototype.getParticle = function(x,y,angle,speed) {
	for (var i = 0; i < this.particleCount; ++i) {
		if (!this.particles[i].inUse) {
			this.particles[i].init(x,y,angle,speed);
			return;
		}
	}
}

ParticleManager.prototype.reset = function() {
	for (var i = 0; i < this.particleCount; ++i) {
		this.particles[i].inUse = false;
	}
}

ParticleManager.prototype.tick = function() {
	for (var i = 0; i < this.particleCount; ++i) {
		if (this.particles[i].inUse) this.particles[i].tick();
	}
}

ParticleManager.prototype.render = function() {
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (var i = 0; i < this.particleCount; ++i) {
		if (this.particles[i].inUse) this.particles[i].render();
	}
	ctx.stroke();
}

var Player = function(x,y) {
	this.x = x;
	this.y = y;
	this.dx = 0.0;
	this.dy = 0.0;
	this.angle = 0.0;
	this.forward = false;
	this.left = false;
	this.right = false;
	this.shoot = false;
	this.hasFired = false;
	this.alive = true;
	this.currentExhaustFrame = 0;
	this.lastExhaustCheck = Date.now();
	this.projectileManager = new ParticleManager(Projectile,this.maxProjectiles);
}

// Load template resources
Player.prototype.init = function() {
	this.shipSprite = new Image();
	this.shipSprite.src = "resource/player.png";
	
	this.exhaustSprite = [new Image(),new Image()];
	this.exhaustSprite[0].src = "resource/exhaust_1.png";
	this.exhaustSprite[1].src = "resource/exhaust_2.png";
}

Player.prototype.tick = function() {
	this.projectileManager.tick();
	
	if (this.left) this.angle -= this.turnSpeed;
	if (this.right) this.angle += this.turnSpeed;
	if (this.forward) {
		this.dx += Math.sin(this.angle) * this.moveSpeed;
		this.dy += -Math.cos(this.angle) * this.moveSpeed;
		
		if (Date.now() - this.lastExhaustCheck > this.exhaustAnimationDelay) {
			++this.currentExhaustFrame;
			if (this.currentExhaustFrame > 1)
				this.currentExhaustFrame = 0;
			
			this.lastExhaustCheck = Date.now();
		}
	}
	
	if (this.shoot && !this.hasFired) {
		this.hasFired = true;
		this.projectileManager.getParticle(
			this.x + Math.sin(this.angle) * this.collisionRadius,
			this.y - Math.cos(this.angle) * this.collisionRadius,
			this.angle,
			7.0
		);
	}
	
	if (this.dx < 0) {
		if (this.dx < -this.maxSpeed) 
			this.dx = -this.maxSpeed;
		
		this.dx += this.stopSpeed;
		if (this.dx > 0)
			this.dx = 0;
	} else if (this.dx > 0) {
		if (this.dx > this.maxSpeed)
			this.dx = this.maxSpeed;
		
		this.dx -= this.stopSpeed;
		if (this.dx < 0)
			this.dx = 0;
	}
	
	if (this.dy < 0) {
		if (this.dy < -this.maxSpeed) 
			this.dy = -this.maxSpeed;
		
		this.dy += this.stopSpeed;
		if (this.dy > 0)
			this.dy = 0;
	} else if (this.dy > 0) {
		if (this.dy > this.maxSpeed)
			this.dy = this.maxSpeed;
		
		this.dy -= this.stopSpeed;
		if (this.dy < 0)
			this.dy = 0;
	}
	
	this.x += this.dx;
	this.y += this.dy;
	
	var distance = 0;
	for (var i = 0; i < asteroids.length; ++i) {
		distance = 	(this.x - asteroids[i].x)*(this.x - asteroids[i].x) +
					(this.y - asteroids[i].y)*(this.y - asteroids[i].y);
		if (distance < Math.pow(asteroids[i].collisionRadius+this.collisionRadius,2)) {
			asteroids[i].split();
			this.alive = false;
			return;
		}
	}
	
	if (this.x < -this.collisionRadius) this.x = imageWidth + this.collisionRadius;
	if (this.x > imageWidth + this.collisionRadius) this.x = -this.collisionRadius;
	if (this.y < -this.collisionRadius) this.y = imageHeight + this.collisionRadius;
	if (this.y > imageHeight + this.collisionRadius) this.y = -this.collisionRadius;
}

Player.prototype.render = function() {
	this.projectileManager.render();
	
	ctx.save();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.translate(this.x,this.y);
	ctx.rotate(this.angle);
	ctx.beginPath();
	
	//ctx.arc(0,0,this.collisionRadius,0,2*Math.PI);
	ctx.drawImage(this.shipSprite,-this.collisionRadius,-this.collisionRadius);
	
	if (this.forward)
		ctx.drawImage(this.exhaustSprite[this.currentExhaustFrame],-this.collisionRadius,-this.collisionRadius);
	
	ctx.stroke();
	ctx.restore();
}

Player.prototype.moveSpeed = 0.1;
Player.prototype.maxSpeed = 5.0;
Player.prototype.stopSpeed = 0.01;
Player.prototype.turnSpeed = 0.1;
Player.prototype.collisionRadius = 30.0;
Player.prototype.shipsprite = null;
Player.prototype.exhaustSprite = [null,null];
Player.prototype.exhaustAnimationDelay = 50;
Player.prototype.maxProjectiles = 15;

var Asteroid = function(x,y,level) {
	this.x = x;
	this.y = y;
	this.dx = Math.random() * this.maxSpeed - this.maxSpeed/2;
	this.dy = Math.random() * this.maxSpeed - this.maxSpeed/2;
	this.angle = 0.0;
	this.angleInc = 0.01 + this.maxTurnSpeed * Math.random();
	this.level = level;
	this.collisionRadius = level * this.minRadius;
}

Asteroid.prototype.init = function() {
	this.sprite = new Image();
	this.sprite.src = "resource/asteroidSprite.png";
}

Asteroid.prototype.split = function() {
	if (this.level > 1) {
		asteroids.push(new Asteroid(this.x,this.y,this.level - 1));
		asteroids.push(new Asteroid(this.x,this.y,this.level - 1));
	}
	debrisManager.setEffect(this.x,this.y);
	this.level = 0;
}

Asteroid.prototype.tick = function() {
	this.angle += this.angleInc;
	if (this.angle > 2*Math.PI) this.angle = 0.0;
	
	this.x += this.dx;
	this.y += this.dy;
	if (this.x < -this.collisionRadius) this.x = imageWidth + this.collisionRadius;
	if (this.x > imageWidth + this.collisionRadius) this.x = -this.collisionRadius;
	if (this.y < -this.collisionRadius) this.y = imageHeight + this.collisionRadius;
	if (this.y > imageHeight + this.collisionRadius) this.y = -this.collisionRadius;
}

Asteroid.prototype.render = function() {
	ctx.save();
	ctx.strokeStyle = "white";
	ctx.lineWidth = 2;
	ctx.translate(this.x,this.y);
	ctx.rotate(this.angle);
	ctx.drawImage(this.sprite,-this.collisionRadius,-this.collisionRadius,this.collisionRadius*2,this.collisionRadius*2);
	ctx.restore();
}

Asteroid.prototype.minRadius = 20.0;
Asteroid.prototype.maxSpeed = 5.0;
Asteroid.prototype.maxTurnSpeed = 0.01;
Asteroid.prototype.sprite = null;

// ---------------------------------------------

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	
	// Load templates
	Player.prototype.init();
	Asteroid.prototype.init();
	
	player = new Player(imageWidth/2,imageHeight/2);
	
	for (var i = 0; i < asteroidCount; ++i) {
		asteroids[i] = new Asteroid(imageWidth*Math.random(),-100,3);
	}
	
	debrisManager = new ParticleManager(Debris,50);
	
	debrisManager.setEffect = function(x,y) {
		var particleNum = 2 + parseInt(Math.random() * 9);
		for (var i = 0; i < particleNum; ++i) {
			this.getParticle(x,y,Math.random()*6.28,1.0+Math.random()*2.0);
		}
	}
	requestAnimationFrame(loop);
}

window.onkeydown = function(e) {
	switch(e.keyCode) {
		case 38: player.forward = true; break;
		case 87: player.forward = true; break;
		
		case 37: player.left = true; break;
		case 65: player.left = true; break;
		
		case 39: player.right = true; break;
		case 68: player.right = true; break;
		
		case 32: player.shoot = true; break;
		
		case 82: reset(); break;
	}
}

window.onkeyup = function(e) {
	switch(e.keyCode) {
		case 38: player.forward = false; break;
		case 87: player.forward = false; break;
		
		case 37: player.left = false; break;
		case 65: player.left = false; break;
		
		case 39: player.right = false; break;
		case 68: player.right = false; break;
		
		case 32: player.shoot = false; player.hasFired = false; break;
	}
}

var reset = function() {
	player = new Player(imageWidth/2,imageHeight/2);
	
	debrisManager.reset();
	
	asteroids = [];
	for (var i = 0; i < asteroidCount; ++i) {
		asteroids[i] = new Asteroid(imageWidth*Math.random(),-100,3);
	}
}

var loop = function() {
	// Tick
	if (player.alive) player.tick();
	debrisManager.tick();
	
	for (var i = 0; i < asteroids.length; ++i) {
		asteroids[i].tick();
		if (!asteroids[i].level) asteroids.splice(i,1);
	}
	// Render
	ctx.fillStyle = "gray";
	ctx.fillRect(0,0,imageWidth,imageHeight);
	if (player.alive) player.render();
	debrisManager.render();
	
	for (var i = 0; i < asteroids.length; ++i) {
		asteroids[i].render();
	}
	//
	requestAnimationFrame(loop);
}