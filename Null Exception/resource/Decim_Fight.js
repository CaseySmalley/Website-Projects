function initDecim() {
	decimAlive = false;
	intro = 0;
	introGlow = false;
	introAlpha = 1.0;
	flashSize = 0;
	
	overlayIMG = document.getElementById("overlay");
	interfaceIMG = document.getElementById("interface");
	resize();
	decim = new Decim_Body();
	projectileManager = new Decim_ProjectileManager();
	interfaceManager = new Decim_InterfaceManager();
	attackManager = new Decim_AttackManager();
	blasterManager = new Decim_BlasterManager();
	player = new Decim_Player();
	backgroundIntroAudio = document.getElementById("interstellarretribrutionpt1");
	backgroundIntroAudio2 = document.getElementById("interstellarretribrutionpt2");
	backgroundAudio = document.getElementById("interstellarretribrutionpt3");
	hitAudio = document.getElementById("hitAudio");
	weakenAudio = document.getElementById("weakenAudio");
	playerHealAudio = document.getElementById("medkitAudio");
	blasterAudio = document.getElementById("blasterAudio");
	blasterAudio.volume = 0.1;
	backgroundAudio.loop = true;
	weakenAudio.volume = 0.2;
	backgroundAudio.volume = 0.32;
	backgroundIntroAudio.volume = 0.32
	backgroundIntroAudio2.volume = 0.32;
	playerHealAudio.volume = 0.25;
	backgroundIntroAudio.currentTime = 0;
	backgroundIntroAudio2.currentTime = 0;
	backgroundAudio.currentTime = 0;
	backgroundIntroAudio.play();
	decim_baseRendering();
}

function closeDecim() {
	delete overlayIMG;
	delete interfaceIMG;
	delete decim;
	delete projectileManager;
	delete interfaceManager;
	delete attackManager;
	delete blasterManager;
	delete player;
	
	backgroundAudio.pause();
	backgroundIntroAudio.pause();
	backgroundIntroAudio2.pause();
	hitAudio.pause();
	weakenAudio.pause();
	playerHealAudio.pause();
	
	delete backgroundAudio;
	delete backgroundIntroAudio;
	delete backgroundIntroAudio2;
	delete hitAudio;
	delete weakenAudio;
	delete playerHealAudio;
}

function decim_resize() {
	CANVAS_WIDTH = window.innerWidth * 0.5;
	CANVAS_HEIGHT = window.innerHeight * 0.984;
	SCALE_X = CANVAS_WIDTH / IMAGE_WIDTH;
	SCALE_Y = CANVAS_HEIGHT / IMAGE_HEIGHT;
	if (hasSetup) {
		decim_baseRendering();
	}
}

function decim_baseRendering() {
	background_canvas.width = background_canvas.width;
	background_canvas_context.fillStyle = "#1a1a1a";
	background_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	background_canvas_context.drawImage(overlayIMG,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	background_canvas_context.drawImage(interfaceIMG,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

// Classes
function Decim_Body() {
	this.width = 400;
	this.height = 250;
	this.x = (IMAGE_WIDTH / 2) - (this.width / 2) - 35;
	this.y = 170;
	this.health = 1.0;
	this.beingDamaged = false;
	this.lastDamaged = Date.now();
	this.damageBob = this.DAMAGE_BOB_LIMIT;
	this.segmentCount = 3;
	this.segments = [];
	this.segments.push(new Decim_BodySegment("decim_legs",40,this.height * 0.65,this.width * 1.0,this.height,this,0,0,0));
	this.segments.push(new Decim_BodySegment("decim_head_frame_",97,-this.height * 0.74,this.width * 0.8,this.height * 0.8,this,1.5,7,2));
	this.segments.push(new Decim_BodySegment("decim_torso",95,-25,this.width * 0.75,this.height,this,1,0,3));
	this.armor = this.DEFAULT_ARMOR;
	this.attack = this.DEFAULT_ATTACK;
	
	this.damage = function() {
		if (!this.beingDamaged && this.health > 0.0) {
			hitAudio.play();
			this.beingDamaged = true;
			this.damageBob = this.DAMAGE_BOB_LIMIT;
			this.health += -(1.0 - this.armor);
			if (this.health <= 0.0) {
				this.health = 0.0;
				interfaceManager.currentState = interfaceManager.STATE_VICTORY;
				interfaceManager.lastVictoryCheck = Date.now();
				backgroundAudio.pause();
			}
		}
	}
	
	this.damageArmor = function() {
		weakenAudio.play();
		this.armor -= 0.05;
		if (this.armor < 0.0) this.armor = 0.0;
	}
	
	this.damageAttack = function() {
		weakenAudio.play();
		this.attack -= 0.02;
		if (this.attack < 0) this.attack = 0.0;
	}
	
	this.tick = function() {
		for (var i = 0 ; i < this.segmentCount ; ++i) {
			this.segments[i].tick();
		}
		
		if (this.beingDamaged) {
			if (this.damageBob < 0) {
				this.beingDamaged = false;
			}
			this.damageBob -= this.DAMAGE_ACC;
		}
	}
	
	this.render = function() {
		for (var i = 0 ; i < this.segmentCount ; ++i) {
			this.segments[i].render();
		}
	}
}

function Decim_BodySegment(id,x,y,width,height,parent,bobHeight,frameCount,sideBobHeight) {
	this.x = x + parent.x;
	this.y = y + parent.y;
	this.dx = ((Math.random() * 2) - 1) * 5;
	this.dy = -7.0;
	this.width = width;
	this.height = height;
	this.bob = 0;
	this.sideBob = 0;
	this.bobHeight = bobHeight;
	this.sideBobHeight = sideBobHeight;
	this.currentBob = 0;
	this.currentSideBob = 0;
	this.parent = parent;
	this.frameCount = frameCount;
	if (frameCount == 0) {
		this.image = document.getElementById(id);
	} else {
		this.frameCount -= 3;
		this.image = [];
		this.play = false;
		this.currentFrame = 0;
		this.lastFrame = Date.now();
		for (var i = 0 ; i < frameCount ; ++i) {
			this.image.push(document.getElementById(id + i));
		}
	}
	
	this.tick = function() {
		if (decim.health > 0.0) {
			if (!decim.beingDamaged && intro > 1) {this.currentBob += this.BOB_SPEED * 2; this.currentSideBob += this.BOB_SPEED;}
			else this.currentBob += this.BOB_SPEED * 0.5;
			if (this.currentBob > 2 * Math.PI)
				this.currentBob = 0;
			if (this.currentSideBob > 2 * Math.PI)
				this.currentSideBob = 0;
			this.bob = Math.sin(this.currentBob) * this.bobHeight;
			if (this.frameCount == 0) this.sideBob = Math.cos(this.currentSideBob) * this.sideBobHeight; else
									  this.sideBob = Math.cos(this.currentSideBob - 0.3) * this.sideBobHeight;
		
			if (this.frameCount != 0) {
			if (this.play) {
				if (Date.now() - this.lastFrame > this.FRAME_TIME) {
					this.currentFrame++;
					if (this.currentFrame > this.frameCount - 1) {
						this.currentFrame = 0;
						this.play = false;
					}
					this.lastFrame = Date.now();
				}
			} else {
				if (Date.now() - this.lastFrame > this.ANIMATION_DELAY) {
					this.play = true;
				}
			}
			}
		} else if (decim.health == 0 && !decim.beingDamaged) {
		this.dy += 0.3;
		this.y += this.dy;
		this.x += this.dx;
		}
	}
		
	this.render = function() {
		if (intro > 1) {
		if (!decim.beingDamaged) {
			if (interfaceManager.currentState != interfaceManager.STATE_VICTORY) {
				if (frameCount == 0) {
						entities_buffer_context.drawImage(this.image,this.x  + this.sideBob,this.y + this.bob,this.width,this.height);
					} else {
						entities_buffer_context.drawImage(this.image[this.currentFrame],this.x  + this.sideBob,this.y + this.bob,this.width,this.height);
					}
				} else {
					if (frameCount == 0) {
						entities_buffer_context.drawImage(this.image,this.x,this.y + this.bob,this.width,this.height);
					} else {
						entities_buffer_context.drawImage(this.image[5],this.x,this.y + this.bob,this.width,this.height);
					}
				}
			} else {
				if (frameCount == 0) {
					entities_buffer_context.drawImage(this.image,this.x + (Math.sin(decim.damageBob) * decim.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
				} else {
					if (interfaceManager.currentState == interfaceManager.STATE_VICTORY)
						entities_buffer_context.drawImage(this.image[5],this.x + (Math.sin(decim.damageBob) * decim.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
					else
						entities_buffer_context.drawImage(this.image[4],this.x + (Math.sin(decim.damageBob) * decim.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
				}
			}
		} else {
			if (frameCount == 0) {
						entities_buffer_context.drawImage(this.image,this.x,this.y + this.bob * 1.5,this.width,this.height);
					} else {
						if (introGlow) entities_buffer_context.drawImage(this.image[6],this.x,this.y + this.bob * 1.5,this.width,this.height);
						else entities_buffer_context.drawImage(this.image[5],this.x,this.y + this.bob * 1.5,this.width,this.height);
					}
		}
	}
}

function Decim_ProjectileManager() {
	this.projectiles = [];
	this.stackCount = this.PROJECTILE_LIMIT;
	this.previousCount = 0;
	for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
		this.projectiles.push(new Decim_Projectile(0,0,this.PROJECTILE_RADIUS));
	}
	
	this.addProjectile = function(projectile) {
		this.projectiles.push(projectile);
		++this.stackCount;
	}
	
	this.requestProjectile = function(x,y,dx,dy) {
		if (this.stackCount > 0) {
			--this.stackCount;
			var j;
			for (var i = 0 ; i < this.PROJECTILE_LIMIT ; i++) {
				if (!this.projectiles[i].inUse) {
					this.projectiles[i].x = x;
					this.projectiles[i].y = y;
					this.projectiles[i].dx = dx;
					this.projectiles[i].dy = dy;
					this.projectiles[i].inUse = true;
					break;
				}
			}
			return this.projectiles[i];
		} else {
			return null;
		}
	}
	
	this.returnProjectile = function(projectile) {
		projectile.x = 0;
		projectile.y = 0;
		projectile.inUse = false;
		++this.stackCount;
	}
	
	this.tick = function() {
		for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
			if (this.projectiles[i].inUse) {
				this.projectiles[i].tick();
				if (this.collision(this.projectiles[i].x,this.projectiles[i].y,player.x,player.y,this.projectiles[i].radius + player.RADIUS)) {
					player.damage();
					this.returnProjectile(this.projectiles[i]);
				}
			}
		}
	}
	
	this.render = function() {
		projectiles_buffer_context.fillStyle = '#ffffff';
		projectiles_buffer_context.beginPath();
		for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
			if (this.projectiles[i].inUse) this.projectiles[i].render();
		}
		projectiles_buffer_context.fill();
	}
}

function Decim_Projectile(x,y,radius) {
	this.x = x;
	this.y = y;
	this.dx = 0;
	this.dy = 0;
	this.radius = radius;
	this.colided = false;
	this.inUse = false;
	this.tick = function() {
		this.x += this.dx;
		this.y += this.dy;
		if (this.x < projectileManager.PROJECTILE_BOUNDARY_X || 
		    this.x > projectileManager.PROJECTILE_BOUNDARY_X + projectileManager.PROJECTILE_BOUNDARY_WIDTH || 
			this.y < projectileManager.PROJECTILE_BOUNDARY_Y || 
			this.y > projectileManager.PROJECTILE_BOUNDARY_Y + projectileManager.PROJECTILE_BOUNDARY_HEIGHT)
			projectileManager.returnProjectile(this);
	}
	
	this.render = function() {
		projectiles_buffer_context.moveTo(Math.round(this.x),Math.round(this.y));
		projectiles_buffer_context.arc(Math.round(this.x),Math.round(this.y),this.radius,0,2 * Math.PI,false);
	}
}

function Decim_BlasterManager() {
	this.projectiles = [];
	this.fireTriggered = false;
	this.stackCount = this.PROJECTILE_LIMIT;
	this.previousCount = 0;
	for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
		this.projectiles.push(new Decim_Blaster(0,0,0));
	}
	
	this.addProjectile = function(projectile) {
		this.projectiles.push(projectile);
		++this.stackCount;
	}
	
	this.requestProjectile = function(x,y,angle) {
		if (this.stackCount > 0) {
			--this.stackCount;
			var j;
			for (var i = 0 ; i < this.PROJECTILE_LIMIT ; i++) {
				if (!this.projectiles[i].inUse) {
					this.projectiles[i].x = x;
					this.projectiles[i].y = y;
					this.projectiles[i].angle = angle;
					this.projectiles[i].inUse = true;
					this.projectiles[i].isTriggered = false;
					this.projectiles[i].currentState = 0;
					break;
				}
			}
			return this.projectiles[i];
		} else {
			return null;
		}
	}
	
	this.requestTriggeredProjectile = function(x,y,angle) {
		if (this.stackCount > 0) {
			--this.stackCount;
			var j;
			for (var i = 0 ; i < this.PROJECTILE_LIMIT ; i++) {
				if (!this.projectiles[i].inUse) {
					this.projectiles[i].x = x;
					this.projectiles[i].y = y;
					this.projectiles[i].angle = angle;
					this.projectiles[i].inUse = true;
					this.projectiles[i].isTriggered = true;
					this.projectiles[i].currentState = 0;
					break;
				}
			}
			return this.projectiles[i];
		} else {
			return null;
		}
	}
	
	this.returnProjectile = function(projectile) {
		projectile.x = 0;
		projectile.y = 0;
		projectile.angle = 0;
		projectile.inUse = false;
		projectile.offsetRotation = Math.PI;
		projectile.offset = projectile.OFFSET_LIMIT;
		projectile.beam = projectile.BEAM_DEFAULT;
		++this.stackCount;
	}
	
	this.tick = function() {
		for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
			if (this.projectiles[i].inUse) {
				this.projectiles[i].tick();
			}
		}
		
		if (this.fireTriggered) this.fireTriggered = false;
	}
	
	this.render = function() {
		projectiles_buffer_context.fillStyle = '#ffffff';
		projectiles_buffer_context.beginPath();
		for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
			if (this.projectiles[i].inUse) this.projectiles[i].render();
		}
		projectiles_buffer_context.fill();
	}
}
Decim_BlasterManager.prototype.PROJECTILE_LIMIT = 100;
Decim_BlasterManager.prototype.pointToOBB = function(px,py,cx,cy,cw,ch,ca) {
	px -= cx;
	py -= cy;
	var xnew = px * Math.cos(ca) + py * Math.sin(ca) + cx;
	var ynew = px * Math.sin(ca) - py * Math.cos(ca) + cy;
	return (xnew > cx) && (xnew < cx + cw) &&
		   (ynew > cy - ch/2) && (ynew < cy + ch/2);
}

function Decim_Blaster(x,y,angle) {
	this.x = x;
	this.y = y;
	this.isTriggered = false;
	this.angle = angle;
	this.alpha = 0.0;
	this.lastDelay = Date.now();
	this.offsetRotation = Math.PI;
	this.offset = this.OFFSET_LIMIT;
	this.beam = this.BEAM_DEFAULT;
	this.currentState = this.STATE_IDLE;
	this.inUse = false;
	
	this.tick = function() {
		switch(this.currentState) {
			case this.STATE_ARMING:
				this.offset -= this.OFFSET_SPEED;
				this.offsetRotation -= this.OFFSET_ROTATION_ACC;
				this.alpha += this.OFFSET_ALPHA_INC;
				if (this.alpha > 1.0) this.alpha = 1.0;
				if (this.offsetRotation < 0.0) this.offsetRotation = 0.0;
				if (this.offset < 0) {
					this.offset = 0;
					this.lastDelay = Date.now();
					this.currentState = this.STATE_FIRING_DELAY;
				}
			break;
			case this.STATE_FIRING_DELAY:
				if (!this.isTriggered) {
					if (Date.now() - this.lastDelay > this.FIRING_DELAY) {
						this.currentState = this.STATE_FIRING;
						var tempNoise = blasterAudio.cloneNode(true);
						tempNoise.volume = 0.3;
						tempNoise.play();
					}
				} else {
					if (blasterManager.fireTriggered) {
						this.currentState = this.STATE_FIRING;
						var tempNoise = blasterAudio.cloneNode(true);
						tempNoise.volume = 0.3;
						tempNoise.play();
						this.isTriggered = false;
					}
				}
			break;
			case this.STATE_FIRING:
				if (blasterManager.pointToOBB(player.x,player.y,this.x + this.WIDTH/2,this.y + this.HEIGHT/2,1000,this.beam,this.angle)) {
					player.damage();
				}
				if (this.beam > 0) this.beam -= this.BEAM_DECAY;
				if (this.beam < 0) {
					this.beam = 0;
					this.currentState = this.STATE_DISARMING;
				}
			break;
			case this.STATE_DISARMING:
				this.offset += this.OFFSET_SPEED;
				//this.offsetRotation -= this.OFFSET_ROTATION_ACC;
				this.alpha -= this.OFFSET_ALPHA_INC;
				if (this.alpha < 0.0) this.alpha = 0.0;
				//if (this.offsetRotation > Math.PI) this.offsetRotation = Math.PI;
				if (this.offset > this.OFFSET_LIMIT) {
					this.offset = this.OFFSET_LIMIT;
					this.currentState = this.STATE_IDLE;
				}
			break;
			case this.STATE_IDLE:
				blasterManager.returnProjectile(this);
			break;
		}
	}
	
	this.render = function() {
		projectiles_buffer_context.save();
		projectiles_buffer_context.translate(this.x,this.y);
		projectiles_buffer_context.translate(this.WIDTH / 2,this.HEIGHT / 2);
		projectiles_buffer_context.rotate(this.angle);
		projectiles_buffer_context.translate(-this.offset,0);
		projectiles_buffer_context.rotate(this.offsetRotation);
		projectiles_buffer_context.fillStyle = 'white';
		projectiles_buffer_context.globalAlpha = this.alpha;
		switch(this.currentState) {
			case this.STATE_ARMING:
				projectiles_buffer_context.drawImage(this.BLASTER_IMG,-this.WIDTH/2,-this.HEIGHT/2);
			break;
			case this.STATE_FIRING_DELAY:
				projectiles_buffer_context.drawImage(this.BLASTER_IMG,-this.WIDTH/2,-this.HEIGHT/2);
			break;
			case this.STATE_FIRING:
				if (this.beam < this.HEIGHT * 0.9) projectiles_buffer_context.fillRect(0,-this.beam / 2,1500,this.beam);
				else projectiles_buffer_context.fillRect(0,(-this.HEIGHT * 0.9) / 2,1500,this.HEIGHT * 0.9);
				projectiles_buffer_context.drawImage(this.BLASTER_IMG,-this.WIDTH/2,-this.HEIGHT/2);
			break;
			case this.STATE_DISARMING:
				projectiles_buffer_context.drawImage(this.BLASTER_IMG,-this.WIDTH/2,-this.HEIGHT/2);
			break;
		}
		projectiles_buffer_context.restore();
	}
}

Decim_Blaster.prototype.WIDTH = 100;
Decim_Blaster.prototype.HEIGHT = 50;
Decim_Blaster.prototype.BEAM_DECAY = 0.8;
Decim_Blaster.prototype.BEAM_DEFAULT = 60;
Decim_Blaster.prototype.FIRING_DELAY = 250;
Decim_Blaster.prototype.OFFSET_LIMIT = 100;
Decim_Blaster.prototype.OFFSET_SPEED = 3.0;
Decim_Blaster.prototype.OFFSET_ROTATION_ACC = Math.PI / ((Decim_Blaster.prototype.OFFSET_LIMIT * 0.95) / Decim_Blaster.prototype.OFFSET_SPEED);
Decim_Blaster.prototype.OFFSET_ALPHA_INC = 1.0 / ((Decim_Blaster.prototype.OFFSET_LIMIT * 0.95) / Decim_Blaster.prototype.OFFSET_SPEED);
Decim_Blaster.prototype.STATE_ARMING = 0;
Decim_Blaster.prototype.STATE_FIRING_DELAY = 4;
Decim_Blaster.prototype.STATE_FIRING = 1;
Decim_Blaster.prototype.STATE_DISARMING = 2;
Decim_Blaster.prototype.STATE_IDLE = 3;
Decim_Blaster.prototype.BLASTER_IMG = document.getElementById("DecimBlaster");


function testBlast(px,py,div) {
	var x = 0.0;
	var y = 0.0;
	var distance = 50;
	var inc = (2*Math.PI) / div;
	for (var angle = inc ; angle <= 2*Math.PI ; angle += inc) {
		x = Math.cos(angle) * distance;
		y = Math.sin(angle) * distance;
		blasterManager.requestProjectile(px + x,py + y,angle);
	}
}

function Decim_AttackManager() {
	
	this.currentSequence = 0;
	this.sequenceAttackCount = 0;
	this.lastSequence = Date.now();
	
	this.tick = function() {
		if (interfaceManager.currentState == interfaceManager.STATE_FIGHT) {
			switch(this.currentSequence) {
				case 0:
					this.sequence0();
				break;
				case 1:
					this.sequence1();
				break;
				case 2:
					this.sequence2();
				break;
				case 3:
					this.sequence3();
				break;
				case 4:
					this.sequence4();
				break;
				case 5:
					this.sequence5();
				break;
				case 6:
					this.sequence6();
				break;
				case 7:
					this.sequence7();
				break;
				case 8:
					this.sequence8();
				break;
				case 9:
					this.sequence9();
				break;
				default:
					this.currentSequence = 0;
				break;
			}
		}
	}
	
	this.breakSequence = function() {
		this.sequenceAttackCount = 0;
		++this.currentSequence;
		interfaceManager.currentState = interfaceManager.STATE_MENU;
	}
	
	// Attack Sequences
	this.sequence0 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 2: this.blaster(0,0,0.5*3.14); break;
				case 3: this.blaster(50,0,0.5*3.14); break;
				case 4: this.blaster(100,0,0.5*3.14); break;
				case 5: this.blaster(150,0,0.5*3.14); break;
				case 6: this.blaster(200,0,0.5*3.14); break;
				case 7: this.blaster(250,0,0.5*3.14); break;
				case 8: this.blaster(300,0,0.5*3.14); break;
				case 9: this.blaster(350,0,0.5*3.14); break;
				case 10: this.blaster(400,0,0.5*3.14); break;
				case 11: this.blaster(450,0,0.5*3.14); break;
				
				case 12: this.blaster(-110,100,0); this.blaster(-110,150,0); this.blaster(-110,200,0);break;
				
				case 16: this.blaster(550,0,0.5*3.14); break;
				case 17: this.blaster(500,0,0.5*3.14); break;
				case 18: this.blaster(450,0,0.5*3.14); break;
				case 19: this.blaster(400,0,0.5*3.14); break;
				case 20: this.blaster(350,0,0.5*3.14); break;
				case 21: this.blaster(300,0,0.5*3.14); break;
				case 22: this.blaster(250,0,0.5*3.14); break;
				case 23: this.blaster(200,0,0.5*3.14); break;
				case 24: this.blaster(150,0,0.5*3.14); break;
				case 25: this.blaster(100,0,0.5*3.14); break;
				
				case 30: this.linePattern(10,25,7,-8); break;
				case 31: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 32: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 33: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 34: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 35: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 36: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 37: 						       this.linePattern(75,25,7,-8); break;
				case 38: 							   this.linePattern(50,25,8,-8); break;
				case 39: 						       this.linePattern(75,25,7,-8); break;
				case 40: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 41: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 42: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 43: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 44: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 45: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 46: this.linePattern(10,25,7,-8); break;
				
				case 47: this.linePattern(10,25,7,-8); break;
				case 48: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 49: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 50: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 51: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 52: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 53: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 54: 						       this.linePattern(75,25,7,-8); break;
				case 55: 							   this.linePattern(50,25,8,-8); break;
				case 56: 						       this.linePattern(75,25,7,-8); break;
				case 57: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 58: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 59: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 60: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 61: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 62: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 63: this.linePattern(10,25,7,-8); break;
				
				case 65: this.blaster(0,0,0.5*3.14); break;
				case 66: this.blaster(50,0,0.5*3.14); break;
				case 67: this.blaster(100,0,0.5*3.14); break;
				case 68: this.blaster(150,0,0.5*3.14); break;
				case 69: this.blaster(200,0,0.5*3.14); break;
				case 70: this.blaster(250,0,0.5*3.14); break;
				case 71: this.blaster(300,0,0.5*3.14); break;
				case 72: this.blaster(350,0,0.5*3.14); break;
				case 73: this.blaster(400,0,0.5*3.14); break;
				case 74: this.blaster(450,0,0.5*3.14); break;
				
				case 82: this.blaster(630,280,3.14); this.blaster(630,230,3.14);this.blaster(530,380,3.14*1.5); this.blaster(480,380,3.14*1.5); break;
				
				case 89: this.blaster(-23,0,0.5*3.14); this.blaster(30,0,0.5*3.14);this.blaster(-120,110,0); this.blaster(-120,170,0); break;
				
				
				case 93: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence1 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 2: this.aimedBlaster(-120,Math.random()*230); break;
				case 6: this.aimedBlaster(620,Math.random()*230); break;
				case 10: this.aimedBlaster(-120,Math.random()*230); break;
				case 14: this.aimedBlaster(620,Math.random()*230); break;
				case 18: this.aimedBlaster(-120,Math.random()*230); break;
				case 22: this.aimedBlaster(620,Math.random()*230); break;
				case 26: this.aimedBlaster(-120,Math.random()*230); break;
				case 30: this.aimedBlaster(620,Math.random()*230); break;
				case 34: this.aimedBlaster(-120,Math.random()*230); break;
				case 38: this.aimedBlaster(620,Math.random()*230); break;
				case 42: this.aimedBlaster(-120,Math.random()*230); break;
				case 46: this.aimedBlaster(620,Math.random()*230); break;
				case 50: this.aimedBlaster(-120,Math.random()*230); break;
				case 54: this.aimedBlaster(620,Math.random()*230); break;
				case 58: this.aimedBlaster(-120,Math.random()*230); break;
				case 65: this.breakSequence(); break;
			}
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence2 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				//angleLinePattern = function(x,div,angle,amount,speed) 
				case 0: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 3: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 6: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 9: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 12: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 15: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 18: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 21: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 24: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 30: this.breakSequence(); break;
			}
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence3 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.linePattern(10,25,7,-8); break;
				case 1: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 2: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 3: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 4: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 5: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 6: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); this.blaster(0,0,0.5*3.14);break;
				case 7: 						       this.linePattern(75,25,7,-8); break;
				case 8: 							   this.linePattern(50,25,8,-8); break;
				case 9: 						       this.linePattern(75,25,7,-8); break;
				case 10: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); this.blaster(70,0,0.5*3.14);break;
				case 11: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 12: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 13: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 14: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); this.blaster(140,0,0.5*3.14);break;
				case 15: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 16: this.linePattern(10,25,7,-8); break;
				
				case 17: this.linePattern(10,25,7,-8); break;
				case 18: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); this.blaster(210,0,0.5*3.14);break;
				case 19: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 20: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 21: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 22: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); this.blaster(280,0,0.5*3.14);break;
				case 23: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 24: 						       this.linePattern(75,25,7,-8); break;
				case 25: 							   this.linePattern(50,25,8,-8); break;
				case 26: 						       this.linePattern(75,25,7,-8); this.blaster(350,0,0.5*3.14);break;
				case 27: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 28: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 29: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 30: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); this.blaster(420,0,0.5*3.14);break;
				case 31: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 32: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 33: this.linePattern(10,25,7,-8); break;
				
				case 34: this.linePattern(10,25,7,-8); this.blaster(490,0,0.5*3.14);break;
				case 35: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 36: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 37: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 38: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); this.blaster(420,0,0.5*3.14);break;
				case 39: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 40: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 41: 						       this.linePattern(75,25,7,-8); break;
				case 42: 							   this.linePattern(50,25,8,-8); this.blaster(350,0,0.5*3.14);break;
				case 43: 						       this.linePattern(75,25,7,-8); break;
				case 44: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 45: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 46: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); this.blaster(280,0,0.5*3.14);break;
				case 47: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 48: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 49: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 50: this.linePattern(10,25,7,-8); this.blaster(210,0,0.5*3.14);break;
				
				case 51: this.linePattern(10,25,7,-8); break;
				case 52: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 53: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 54: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); this.blaster(140,0,0.5*3.14);break;
				case 55: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 56: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); break;
				case 57: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 58: 						       this.linePattern(75,25,7,-8); this.blaster(70,0,0.5*3.14);break;
				case 59: 							   this.linePattern(50,25,8,-8); break;
				case 60: 						       this.linePattern(75,25,7,-8); break;
				case 61: this.linePattern(10,25,1,-8); this.linePattern(100,25,6,-8); break;
				case 62: this.linePattern(10,25,2,-8); this.linePattern(125,25,5,-8); this.blaster(0,0,0.5*3.14);break;
				case 63: this.linePattern(10,25,3,-8); this.linePattern(150,25,4,-8); break;
				case 64: this.linePattern(10,25,4,-8); this.linePattern(175,25,3,-8); break;
				case 65: this.linePattern(10,25,5,-8); this.linePattern(200,25,2,-8); break;
				case 66: this.linePattern(10,25,6,-8); this.linePattern(225,25,1,-8); break;
				case 67: this.linePattern(10,25,7,-8); break;
				case 75: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence4 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.boxPatternRight(10,25,5); break;
				case 2: this.boxPatternLeft(125,25,5); break;
				case 4: this.boxPatternRight(10,25,5); this.blaster(-130,100,0); break;
				case 6: this.boxPatternLeft(125,25,5); break;
				case 8: this.boxPatternRight(10,25,5); break;
				case 10: this.boxPatternLeft(125,25,5); this.blaster(-130,170,0); break;
				case 12: this.boxPatternRight(10,25,5); break;
				case 14: this.boxPatternLeft(125,25,5); break;
				case 16: this.boxPatternRight(10,25,5); this.blaster(-130,240,0); break;
				case 18: this.boxPatternLeft(125,25,5); break;
				case 20: this.boxPatternRight(10,25,5); break;
				case 22: this.boxPatternLeft(125,25,5); this.blaster(-130,310,0); break;
				case 24: this.boxPatternRight(10,25,5); break;
				case 26: this.boxPatternLeft(125,25,5); break;
				case 28: this.boxPatternRight(10,25,5); break;
				case 30: this.boxPatternLeft(125,25,5); this.blaster(-130,100,0); this.blaster(-130,170,0); break;
				case 32: this.boxPatternRight(10,25,5); break;
				case 34: this.boxPatternLeft(125,25,5); break;
				case 36: this.boxPatternRight(10,25,5); this.blaster(-130,240,0); this.blaster(-130,310,0); break;
				case 38: this.boxPatternLeft(125,25,5); break;
				case 40: this.boxPatternRight(10,25,5); break;
				case 42: this.boxPatternLeft(125,25,5); break;
				
				case 60: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence5 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 2: this.aimedBlaster(-120,Math.random()*230); break;
				case 6: this.aimedBlaster(620,Math.random()*230); break;
				case 10: this.aimedBlaster(-120,Math.random()*230); break;
				case 14: this.aimedBlaster(620,Math.random()*230); break;
				case 18: this.aimedBlaster(-120,Math.random()*230); break;
				case 22: this.aimedBlaster(620,Math.random()*230); break;
				case 26: this.aimedBlaster(-120,Math.random()*230); break;
				case 30: this.aimedBlaster(620,Math.random()*230); break;
				case 34: this.aimedBlaster(-120,Math.random()*230); break;
				case 38: this.aimedBlaster(620,Math.random()*230); break;
				case 42: this.aimedBlaster(-120,Math.random()*230); break;
				case 46: this.aimedBlaster(620,Math.random()*230); break;
				case 50: this.aimedBlaster(-120,Math.random()*230); break;
				case 54: this.aimedBlaster(620,Math.random()*230); break;
				case 58: this.aimedBlaster(-120,Math.random()*230); break;
				case 65: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence6 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 4: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 8: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 12: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 16: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 20: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 24: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 28: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 32: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 36: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 40: this.blaster(0,0,0.5*3.14); this.blaster(140,0,0.5*3.14); this.blaster(280,0,0.5*3.14); this.blaster(420,0,0.5*3.14); break;
				case 44: this.blaster(70,0,0.5*3.14); this.blaster(210,0,0.5*3.14); this.blaster(350,0,0.5*3.14); this.blaster(490,0,0.5*3.14); break;
				case 50: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence7 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 2: this.aimedBlaster(-120,Math.random()*230); break;
				case 6: this.aimedBlaster(620,Math.random()*230); break;
				case 10: this.aimedBlaster(-120,Math.random()*230); break;
				case 14: this.aimedBlaster(620,Math.random()*230); break;
				case 18: this.aimedBlaster(-120,Math.random()*230); break;
				case 22: this.aimedBlaster(620,Math.random()*230); break;
				case 26: this.aimedBlaster(-120,Math.random()*230); break;
				case 30: this.aimedBlaster(620,Math.random()*230); break;
				case 34: this.aimedBlaster(-120,Math.random()*230); break;
				case 38: this.aimedBlaster(620,Math.random()*230); break;
				case 42: this.aimedBlaster(-120,Math.random()*230); break;
				case 46: this.aimedBlaster(620,Math.random()*230); break;
				case 50: this.aimedBlaster(-120,Math.random()*230); break;
				case 54: this.aimedBlaster(620,Math.random()*230); break;
				case 58: this.aimedBlaster(-120,Math.random()*230); break;
				case 65: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence8 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.triggeredBlaster(520,0,0.5*3.14); this.triggeredBlaster(650,120,3.14); break;
				case 1: this.triggeredBlaster(450,0,0.5*3.14); break;
				case 2: this.triggeredBlaster(380,0,0.5*3.14); this.triggeredBlaster(650,180,3.14); break;
				case 3: this.triggeredBlaster(310,0,0.5*3.14); break;
				case 4: this.triggeredBlaster(240,0,0.5*3.14); this.triggeredBlaster(650,240,3.14); break;
				case 5: this.triggeredBlaster(170,0,0.5*3.14); break;
				case 6: this.triggeredBlaster(100,0,0.5*3.14); this.triggeredBlaster(650,300,3.14); break;
				case 7: this.triggeredBlaster(30,0,0.5*3.14); break;
				case 10: blasterManager.fireTriggered = true; break;
				
				case 20: this.triggeredBlaster(500,0,0.5*3.14); this.triggeredBlaster(-130,80,0); break;
				case 21: this.triggeredBlaster(430,0,0.5*3.14); break;
				case 22: this.triggeredBlaster(360,0,0.5*3.14); this.triggeredBlaster(-130,140,0); break;
				case 23: this.triggeredBlaster(290,0,0.5*3.14); break;
				case 24: this.triggeredBlaster(220,0,0.5*3.14); this.triggeredBlaster(-130,200,0); break;
				case 25: this.triggeredBlaster(150,0,0.5*3.14); break;
				case 26: this.triggeredBlaster(80,0,0.5*3.14); this.triggeredBlaster(-130,260,0); break;
				case 27: this.triggeredBlaster(10,0,0.5*3.14); break;
				case 30: blasterManager.fireTriggered = true; break;
				
				case 35: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence9 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.blaster(250,0,0.5*3.14); break;
				case 3: this.blaster(180,0,0.5*3.14); this.blaster(320,0,0.5*3.14); break;
				case 6: this.blaster(110,0,0.5*3.14); this.blaster(390,0,0.5*3.14); break;
				case 9: this.blaster(40,0,0.5*3.14); this.blaster(460,0,0.5*3.14); break;
				case 12: this.blaster(-30,0,0.5*3.14); this.blaster(530,0,0.5*3.14); break;
				case 15: this.blaster(-110,150,0); this.blaster(-110,220,0); break;
				case 20: this.blaster(-110,100,0); this.blaster(-110,270,0); break;
				
				case 23: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 26: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 29: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 32: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 35: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 38: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 41: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 44: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				case 47: this.verticalLinePattern(10,25,12,2); this.verticalLinePattern(310,25,12,-2); break;
				
				case 55: this.triggeredBlaster(-100,20,0.25*3.14); this.triggeredBlaster(610,20,0.75*3.14); this.triggeredBlaster(610,360,1.25*3.14); this.triggeredBlaster(-100,360,1.75*3.14); break;
				case 56: this.triggeredBlaster(250,-25,0.5*3.14); this.triggeredBlaster(-130,190,0); break;
				
				case 60: blasterManager.fireTriggered = true; break;
				
				case 65: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.convertAngle = function(degrees) {
		return degrees * (Math.PI / 180.0);
	}
	
	// Blaster Patterns
	
	this.blaster = function(x,y,angle) {
		blasterManager.requestProjectile(player.BOUNDARY_X + x,player.BOUNDARY_Y - 100 + y,angle);
	}
	
	this.triggeredBlaster = function(x,y,angle) {
		blasterManager.requestTriggeredProjectile(player.BOUNDARY_X + x,player.BOUNDARY_Y - 100 + y,angle);
	}
	
	this.aimedBlaster = function(x,y) {
		var angle = Math.atan2(player.y - (y + player.BOUNDARY_Y + 20),player.x - (x + player.BOUNDARY_X));
		blasterManager.requestProjectile(player.BOUNDARY_X + x,player.BOUNDARY_Y + y,angle);
	}
	
	this.randomAim = function(amount) {
		var angle = 0.0;
		for (var i = 0 ; i < amount ; ++i) {
			angle = Math.random() * 3.14;
			x = Math.sin(angle) * 400;
			y = Math.cos(angle) * 400;
			blasterManager.requestProjectile(player.BOUNDARY_X + x,player.BOUNDARY_Y - 100 + y,0.5*3.14);
		}
	}
	
	// Attack Patterns
	this.angleLinePattern = function(x,div,angle,amount,speed) {
		for (var i = 0 ; i < amount ; i++) {
			projectileManager.requestProjectile(player.BOUNDARY_X + x + i * div,player.BOUNDARY_Y + 1,Math.sin(angle) * speed,Math.cos(angle) * speed);
		}
	}
	
	this.testingPattern = function(x,y,div,angle,amount,speed) {
		for (var i = 0 ; i < amount ; i++) {
			projectileManager.requestProjectile(player.BOUNDARY_X + x + i,player.BOUNDARY_Y + y + i * div,Math.sin(angle) * speed,Math.cos(angle) * speed);
		}
	}
	
	this.directProjectile = function(x,y,angle) {
		projectileManager.requestProjectile(x + player.BOUNDARY_X,y + player.BOUNDARY_Y,Math.sin(angle) * 2,Math.cos(angle) * 2);
	}
	
	this.linePattern = function(y,div,amount,speed) {
		if (speed > 0) {
			for (var i = 0 ; i < amount ; i++) {
				projectileManager.requestProjectile(player.BOUNDARY_X + 1,player.BOUNDARY_Y + y + (div * i),speed,0);
			}
		} else {
			for (var i = 0 ; i < amount ; i++) {
				projectileManager.requestProjectile(player.BOUNDARY_X + player.BOUNDARY_WIDTH - 1,player.BOUNDARY_Y + y + (div * i),speed,0);
			}
		}
	}
	
	this.verticalLinePattern = function(x,div,amount,speed) {
		if (speed > 0) {
			for (var i = 0 ; i < amount ; i++) {
				projectileManager.requestProjectile(player.BOUNDARY_X + x + (div * i),player.BOUNDARY_Y + 1,0,speed);
			}
		} else {
			for (var i = 0 ; i < amount ; i++) {
				projectileManager.requestProjectile(player.BOUNDARY_X + x + (div * i),player.BOUNDARY_Y + player.BOUNDARY_HEIGHT - 1,0,speed);
			}
		}
	}
	
	this.boxPatternRight = function(y,div,amount) {
		for (var i = 0 ; i < amount ; i++) {
			projectileManager.requestProjectile(player.BOUNDARY_X + 1,player.BOUNDARY_Y + y + (div * i),2,0);
		}
	}
	
	this.boxPatternLeft = function(y,div,amount) {
		for (var i = 0 ; i < amount ; i++) {
			projectileManager.requestProjectile(player.BOUNDARY_X + player.BOUNDARY_WIDTH - 1,player.BOUNDARY_Y + y + (div * i),-2,0);
		}
	}
	
	this.rightCornerPattern = function(div) {
		div *= (Math.PI / 180.0);
		for (var i = div ; i < Math.PI / 2; i += div) {
			projectileManager.requestProjectile(player.BOUNDARY_X + player.BOUNDARY_WIDTH - 1,player.BOUNDARY_Y + 1,-Math.cos(i) * 2,-Math.cos(i + (Math.PI / 2)) * 2);
		}
	}
	
	this.leftCornerPattern = function(div) {
		div *= (Math.PI / 180.0);
		for (var i = div ; i < Math.PI / 2; i += div) {
			projectileManager.requestProjectile(player.BOUNDARY_X + 1,player.BOUNDARY_Y + 1,Math.cos(i) * 2,-Math.cos(i + (Math.PI / 2)) * 2);
		}
	}
	
	this.semiCirclePattern = function(x,div) {
		div *= (Math.PI / 180.0);
		for (var i = div ; i < Math.PI ; i += div) {
			projectileManager.requestProjectile(x,player.BOUNDARY_Y + 1,-Math.cos(i) * 2,-Math.cos(i + (Math.PI / 2)) * 2);
		}
	}
	
	this.semiCirclePatternOffset = function(x,div,offset) {
		div *= (Math.PI / 180.0);
		for (var i = div ; i < 2 * Math.PI ; i += div) {
			projectileManager.requestProjectile(x,player.BOUNDARY_Y + 1,-Math.cos(i + offset) * 2,-Math.cos(i + offset + (Math.PI / 2)) * 2);
		}
	}
	
	this.lowSemiCirclePattern = function(x,div) {
		div *= (Math.PI / 180.0);
		for (var i = div ; i < Math.PI ; i += div) {
			projectileManager.requestProjectile(x,player.BOUNDARY_Y + player.BOUNDARY_HEIGHT - 1,-Math.cos(i) * 2,Math.cos(i + (Math.PI / 2)) * 2);
		}
	}
}

function Decim_InterfaceManager() {
	this.lastVictoryCheck = 0;
	this.selectedButton = 0;
	this.buttonLimit = 2;
	this.currentState = this.STATE_MENU;
	this.previousState = -1;
	this.dialogue = "";
	
	this.tick = function() {
		if (this.currentState == this.STATE_VICTORY) {
			if (Date.now() - this.lastVictoryCheck > this.STATE_VICTORY_DELAY) {
				panelLoop(STATE_OVERWORLD_LOOP);
			}
		}
	}
	
	this.decrementButton = function() {
		--this.selectedButton;
		if (this.selectedButton < 0)
			this.selectedButton = this.buttonLimit;
	}
	
	this.left = function() {
		switch(this.currentState) {
			case this.STATE_MENU:
				this.decrementButton();
			break;
			case this.STATE_ACT_MENU:
				this.decrementButton();
			break;
			case this.STATE_HEAL_MENU:
				this.decrementButton();
			break;
		}
	}
	
	this.incrementButton = function() {
		++this.selectedButton;
		if (this.selectedButton > this.buttonLimit)
			this.selectedButton = 0;
	}
	
	this.right = function() {
		switch(this.currentState) {
			case this.STATE_MENU:
				this.incrementButton();
			break;
			case this.STATE_ACT_MENU:
				this.incrementButton();
			break;
			case this.STATE_HEAL_MENU:
				this.incrementButton();
			break;
		}
	}
	
	this.enter = function() {
		switch(this.currentState) {
			case this.STATE_MENU:
				switch(this.selectedButton) {
					case 0: this.currentState = this.STATE_FIGHT; decim.damage(); player.resetPosition();break;
					case 1: this.currentState = this.STATE_ACT_MENU; this.selectedButton = 0; this.buttonLimit = 3; break;
					case 2: this.currentState = this.STATE_HEAL_MENU; this.selectedButton = 0; this.buttonLimit = 1; break; 
				}
			break;
			case this.STATE_ACT_MENU:
				switch(this.selectedButton) {
					case 0: this.currentState = this.STATE_FIGHT; this.selectedButton = 0; this.buttonLimit = 2;  player.resetPosition(); decim.damageAttack(); this.dialogueMessage("/n/n Decim's Attack Dropped!"); break;
					case 1: this.currentState = this.STATE_FIGHT; this.selectedButton = 0; this.buttonLimit = 2;  player.resetPosition(); decim.damageArmor();  this.dialogueMessage("/n/n Decim's Defense Dropped!");break;
					case 2: this.currentState = this.STATE_CHECK; this.selectedButton = 1; this.buttonLimit = 2; player.resetPosition();break;
					case 3: this.currentState = this.STATE_MENU; this.selectedButton = 1; this.buttonLimit = 2; player.resetPosition();break;
				}
			break;
			case this.STATE_HEAL_MENU:
				switch(this.selectedButton) {
					case 0: this.currentState = this.STATE_FIGHT; this.selectedButton = 0; this.buttonLimit = 2;  player.resetPosition(); player.heal(); this.dialogueMessage("/n/n       HP Restored"); break;
					case 1: this.currentState = this.STATE_MENU; this.selectedButton = 2; this.buttonLimit = 2; player.resetPosition();break;
				}
			break;
			case this.STATE_CHECK:
				this.currentState = this.STATE_MENU;
			break;
			case this.STATE_DIALOGUE:
				this.currentState = this.previousState;
			break;
		}
	}
	
	this.dialogueMessage = function(text) {
		//interface_buffer_context.font = " " + size + "px  " + font + " ";
		//interface_buffer_context.fillText(message,player.BOUNDARY_X,player.BOUNDARY_Y);
		this.dialogue = text;
		this.previousState = this.currentState;
		this.currentState = this.STATE_DIALOGUE;
	}
	
	this.render = function() {
	interface_buffer_context.fillStyle = '#800000';
	interface_buffer_context.fillRect(this.HEALTH_X,this.HEALTH_Y,this.HEALTH_WIDTH * overworld_player.health,this.HEALTH_HEIGHT);
	interface_buffer_context.fillStyle = '#ffffff';
	interface_buffer_context.fillRect(this.HEALTH_X - 2.5,this.HEALTH_decim_Y - 2.5,this.HEALTH_WIDTH + 5,this.HEALTH_HEIGHT + 5);
	interface_buffer_context.fillStyle = '#000000';
	interface_buffer_context.fillRect(this.HEALTH_X,this.HEALTH_decim_Y,this.HEALTH_WIDTH,this.HEALTH_HEIGHT);
	interface_buffer_context.fillStyle = '#000080';
	interface_buffer_context.fillRect(this.HEALTH_X,this.HEALTH_decim_Y,this.HEALTH_WIDTH * decim.health,this.HEALTH_HEIGHT);
	switch(this.currentState) {
		case this.STATE_MENU:
			if (intro > 1) {
			interface_buffer_context.strokeStyle = '#666666';
			interface_buffer_context.lineWidth = 6;
			switch(this.selectedButton) {
				case 0:
					interface_buffer_context.beginPath();
					interface_buffer_context.rect(this.BUTTON_FIGHT_X,this.BUTTON_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
					interface_buffer_context.stroke();
				break;
				case 1:
					interface_buffer_context.beginPath();
					interface_buffer_context.rect(this.BUTTON_ACT_X,this.BUTTON_Y,this.BUTTON_WIDTH - 1,this.BUTTON_HEIGHT);
					interface_buffer_context.stroke();
				break;
				case 2:
					interface_buffer_context.beginPath();
					interface_buffer_context.rect(this.BUTTON_HEAL_X,this.BUTTON_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
					interface_buffer_context.stroke();
				break;
			}
			}
		break;
		
		case this.STATE_ACT_MENU:
			interface_buffer_context.strokeStyle = '#ffffff';
			interface_buffer_context.fillStyle = '#000000';
			interface_buffer_context.lineWidth = 6;
			interface_buffer_context.fillRect(this.MENU_ACT_X,this.MENU_ACT_Y,this.MENU_ACT_WIDTH,this.MENU_ACT_HEIGHT);
			interface_buffer_context.fillStyle = '#555555';
			interface_buffer_context.beginPath();
			interface_buffer_context.rect(this.MENU_ACT_X,this.MENU_ACT_Y,this.MENU_ACT_WIDTH,this.MENU_ACT_HEIGHT);
			interface_buffer_context.stroke();
			interface_buffer_context.beginPath();
			interface_buffer_context.rect(this.BUTTON_ACT_DO_X,this.BUTTON_ACT_DO_Y - 100,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			interface_buffer_context.rect(this.BUTTON_ACT_DONT_X,this.BUTTON_ACT_DONT_Y - 100,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			interface_buffer_context.rect(this.BUTTON_ACT_DO_X,this.BUTTON_ACT_DO_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			interface_buffer_context.rect(this.BUTTON_ACT_DONT_X,this.BUTTON_ACT_DONT_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			switch(this.selectedButton) {
				case 0:
					interface_buffer_context.fillRect(this.BUTTON_ACT_DO_X,this.BUTTON_ACT_DO_Y - 100,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
				case 1:
					interface_buffer_context.fillRect(this.BUTTON_ACT_DONT_X,this.BUTTON_ACT_DONT_Y - 100,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
				case 2:
					interface_buffer_context.fillRect(this.BUTTON_ACT_DO_X,this.BUTTON_ACT_DO_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
				case 3:
					interface_buffer_context.fillRect(this.BUTTON_ACT_DONT_X,this.BUTTON_ACT_DONT_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
			}
			interface_buffer_context.stroke();
			interface_buffer_context.fillStyle = '#ffffff';
			interface_buffer_context.font = "bold 40px Courier New ";
			interface_buffer_context.fillText(" EMP",this.BUTTON_ACT_DO_X + 40,this.BUTTON_ACT_DO_Y - 55);
			interface_buffer_context.fillText(" Hack",this.BUTTON_ACT_DONT_X + 35,this.BUTTON_ACT_DONT_Y - 55);
			interface_buffer_context.fillText("Scan",this.BUTTON_ACT_DO_X + 45,this.BUTTON_ACT_DO_Y + 45);
			interface_buffer_context.fillText("Back",this.BUTTON_ACT_DONT_X + 60,this.BUTTON_ACT_DONT_Y + 45);
		break;
		
		case this.STATE_CHECK:
			interface_buffer_context.fillStyle = '#000000';
			interface_buffer_context.fillRect(this.MENU_ACT_X,this.MENU_ACT_Y,this.MENU_ACT_WIDTH,this.MENU_ACT_HEIGHT);
			interface_buffer_context.fillStyle = '#ffffff';
			interface_buffer_context.beginPath();
			interface_buffer_context.rect(this.MENU_ACT_X,this.MENU_ACT_Y,this.MENU_ACT_WIDTH,this.MENU_ACT_HEIGHT);
			interface_buffer_context.stroke();
			interface_buffer_context.font = "bold 40px Courier New ";
			interface_buffer_context.fillText("Attack: "+ parseInt(decim.attack * 100)+"%",player.BOUNDARY_X + 150,this.MENU_ACT_Y + 90);
			interface_buffer_context.fillText("Defense: "+ (parseInt(decim.armor * 100))+"%",player.BOUNDARY_X + 150,this.MENU_ACT_Y + 160);
		break;
		
		case this.STATE_HEAL_MENU:
			interface_buffer_context.strokeStyle = '#ffffff';
			interface_buffer_context.fillStyle = '#000000';
			interface_buffer_context.lineWidth = 6;
			interface_buffer_context.fillRect(this.MENU_HEAL_X,this.MENU_HEAL_Y,this.MENU_HEAL_WIDTH,this.MENU_HEAL_HEIGHT);
			interface_buffer_context.fillStyle = '#555555';
			interface_buffer_context.beginPath();
			interface_buffer_context.rect(this.MENU_HEAL_X,this.MENU_HEAL_Y,this.MENU_HEAL_WIDTH,this.MENU_HEAL_HEIGHT);
			interface_buffer_context.stroke();
			interface_buffer_context.beginPath();
			interface_buffer_context.rect(this.BUTTON_HEAL_DO_X,this.BUTTON_HEAL_DO_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			interface_buffer_context.rect(this.BUTTON_HEAL_DONT_X,this.BUTTON_HEAL_DONT_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
			switch(this.selectedButton) {
				case 0:
					interface_buffer_context.fillRect(this.BUTTON_HEAL_DO_X,this.BUTTON_HEAL_DO_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
				case 1:
					interface_buffer_context.fillRect(this.BUTTON_HEAL_DONT_X,this.BUTTON_HEAL_DONT_Y,this.BUTTON_WIDTH,this.BUTTON_HEIGHT);
				break;
			}
			interface_buffer_context.stroke();
			interface_buffer_context.fillStyle = '#ffffff';
			interface_buffer_context.font = "40px Courier New ";
			interface_buffer_context.fillText("Healthkits: " + overworld_player.healingItems,this.MENU_HEAL_X + 50,this.MENU_HEAL_Y + 100);
			interface_buffer_context.font = "bold 40px Courier New ";
			interface_buffer_context.fillText("Back",this.BUTTON_HEAL_DONT_X + 60,this.BUTTON_HEAL_DONT_Y + 45);
			interface_buffer_context.fillText("Heal",this.BUTTON_HEAL_DO_X + 60,this.BUTTON_HEAL_DO_Y + 45);
		break;
		
		case this.STATE_DIALOGUE:
			var lines = this.dialogue.split("/n");
			interface_buffer_context.font = "bold 40px Courier New ";
			interface_buffer_context.fillStyle = '#ffffff';
			for (var i = 0 ; i < lines.length ; i++) {
				interface_buffer_context.fillText(lines[i],player.BOUNDARY_X,player.BOUNDARY_Y + 50 + (i * 40),player.BOUNDARY_WIDTH);
			}
		break;
		}
	}
}

function Decim_Player() {
	this.x = this.BOUNDARY_X + (this.BOUNDARY_WIDTH / 2) - (this.RADIUS / 2);
	this.y = this.BOUNDARY_Y + (this.BOUNDARY_HEIGHT / 2) - (this.RADIUS / 2);
	this.up = false;
	this.down = false;
	this.left = false;
	this.right = false;
	this.invincible = false;
	this.lastDamage = Date.now();
	
	this.resetPosition = function() {
		this.x = this.BOUNDARY_X + (this.BOUNDARY_WIDTH / 2) - (this.RADIUS / 2);
		this.y = this.BOUNDARY_Y + (this.BOUNDARY_HEIGHT / 2) - (this.RADIUS / 2);
	}
	
	this.heal = function() {
		if (overworld_player.healingItems > 0) {
			playerHealAudio.play();
			--overworld_player.healingItems;
			overworld_player.health+= this.HEALING_AMOUNT;
			if (overworld_player.health > 1.0) overworld_player.health = 1.0;
		}
	}
	
	this.tick = function() {
	switch(interfaceManager.currentState) {
	case interfaceManager.STATE_FIGHT:
		if (this.left) this.x -= this.MOVEMENT_SPEED;
		if (this.right) this.x += this.MOVEMENT_SPEED;
		if (this.up) this.y -= this.MOVEMENT_SPEED;
		if (this.down) this.y += this.MOVEMENT_SPEED;
		if (overworld_player.health < 0.0) overworld_player.health = 0.0;
		if (this.x - this.RADIUS < this.BOUNDARY_X) this.x = this.BOUNDARY_X + this.RADIUS;
		if (this.y - this.RADIUS < this.BOUNDARY_Y) this.y = this.BOUNDARY_Y + this.RADIUS;
		if (this.x + this.RADIUS > this.BOUNDARY_X + this.BOUNDARY_WIDTH) this.x = this.BOUNDARY_X + this.BOUNDARY_WIDTH - this.RADIUS;
		if (this.y + this.RADIUS > this.BOUNDARY_Y + this.BOUNDARY_HEIGHT) this.y = this.BOUNDARY_Y + this.BOUNDARY_HEIGHT - this.RADIUS;
		if (this.invincible) {
			if (Date.now() - this.lastDamage > this.DAMAGE_DELAY) {
					this.invincible = false;
			}
		}
	break;
	}
	}
	
	this.damage = function() {
		if (!this.invincible && interfaceManager.currentState == interfaceManager.STATE_FIGHT) {
			this.invincible = true;
			overworld_player.health -= decim.attack;
			this.lastDamage = Date.now();
		}
	}
	
	this.render = function() {
	switch(interfaceManager.currentState) {
	case interfaceManager.STATE_FIGHT:
		projectiles_buffer_context.lineWidth = 4;
		projectiles_buffer_context.strokeStyle = '#ffffff';
		if (!this.invincible) 
			projectiles_buffer_context.fillStyle = '#800000';
		else
			projectiles_buffer_context.fillStyle = '#000080';
		projectiles_buffer_context.beginPath();
		projectiles_buffer_context.arc(this.x,this.y,this.RADIUS,0,2 * Math.PI,false);
		projectiles_buffer_context.stroke();
		projectiles_buffer_context.fill();
	break;
	}
	}
}

// "Static" class members
Decim_ProjectileManager.prototype.collision = function(x1,y1,x2,y2,radius) {
	var distance = (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
	return distance < radius * radius;
}
Decim_ProjectileManager.prototype.beamCollision = function(x1,y1,x2,y2,width,height,angle) {
	var oldx = x1;
	var oldy = y1;
	x1 = Math.cos(angle) * (oldx - x2) - Math.sin(angle) * (oldy - y2) + x2;
	y1 = Math.sin(angle) * (oldx - x2) + Math.cos(angle) * (oldy - y2) + y2;
	
	projectiles_buffer_context.fillStyle = 'red';
	projectiles_buffer_context.fillRect(x1,y1,10,10);
	
	return (x1 > x2 - width / 2) && (x1 < x2 + width / 2) &&
		   (y1 > y2 - height / 2) && (y1 < y2 + height / 2);
}
Decim_Body.prototype.DAMAGE_BOB = 30;
Decim_Body.prototype.DAMAGE_BOB_LIMIT = 4 * Math.PI;
Decim_Body.prototype.DAMAGE_ACC = 0.15;
Decim_Body.prototype.FALL_SPEED = 3.0;
Decim_Body.prototype.DEFAULT_ARMOR = 1.0;
Decim_Body.prototype.DEFAULT_ATTACK = 0.125;
Decim_BodySegment.prototype.ANIMATION_DELAY = 5000;
Decim_BodySegment.prototype.FRAME_TIME = 50;
Decim_BodySegment.prototype.BOB_SPEED = 0.1;
Decim_ProjectileManager.prototype.PROJECTILE_LIMIT = 100;
Decim_ProjectileManager.prototype.PROJECTILE_RADIUS = 5;
Decim_ProjectileManager.prototype.PROJECTILE_BOUNDARY_X = 198;
Decim_ProjectileManager.prototype.PROJECTILE_BOUNDARY_Y = 596;
Decim_ProjectileManager.prototype.PROJECTILE_BOUNDARY_WIDTH = 609;
Decim_ProjectileManager.prototype.PROJECTILE_BOUNDARY_HEIGHT = 236;
Decim_InterfaceManager.prototype.BUTTON_WIDTH = 215;
Decim_InterfaceManager.prototype.BUTTON_HEIGHT = 65;
Decim_InterfaceManager.prototype.BUTTON_Y = 900;
Decim_InterfaceManager.prototype.BUTTON_FIGHT_X = 152;
Decim_InterfaceManager.prototype.BUTTON_ACT_X = 391;
Decim_InterfaceManager.prototype.BUTTON_HEAL_X = 630;
Decim_InterfaceManager.prototype.HEALTH_X = 264;
Decim_InterfaceManager.prototype.HEALTH_Y = 869;
Decim_InterfaceManager.prototype.HEALTH_WIDTH = 476;
Decim_InterfaceManager.prototype.HEALTH_HEIGHT = 12;
Decim_InterfaceManager.prototype.HEALTH_decim_Y = 15;
Decim_InterfaceManager.prototype.HEALTH_WIDTH = 476;
Decim_InterfaceManager.prototype.HEALTH_HEIGHT = 12;
Decim_InterfaceManager.prototype.MENU_HEAL_X = 200;
Decim_InterfaceManager.prototype.MENU_HEAL_Y = 300;
Decim_InterfaceManager.prototype.MENU_HEAL_WIDTH = 600;
Decim_InterfaceManager.prototype.MENU_HEAL_HEIGHT = 250;
Decim_InterfaceManager.prototype.BUTTON_HEAL_DO_X = 240;
Decim_InterfaceManager.prototype.BUTTON_HEAL_DO_Y = 450;
Decim_InterfaceManager.prototype.BUTTON_HEAL_DONT_X = 550;
Decim_InterfaceManager.prototype.BUTTON_HEAL_DONT_Y = 450;
Decim_InterfaceManager.prototype.MENU_ACT_X = 200;
Decim_InterfaceManager.prototype.MENU_ACT_Y = 320;
Decim_InterfaceManager.prototype.MENU_ACT_WIDTH = 600;
Decim_InterfaceManager.prototype.MENU_ACT_HEIGHT = 220;
Decim_InterfaceManager.prototype.BUTTON_ACT_DO_X = 240;
Decim_InterfaceManager.prototype.BUTTON_ACT_DO_Y = 450;
Decim_InterfaceManager.prototype.BUTTON_ACT_DONT_X = 550;
Decim_InterfaceManager.prototype.BUTTON_ACT_DONT_Y = 450;
Decim_InterfaceManager.prototype.DIALOGUE_LENGTH = 100;
Decim_InterfaceManager.prototype.STATE_MENU = 0;
Decim_InterfaceManager.prototype.STATE_FIGHT_MENU = 1;
Decim_InterfaceManager.prototype.STATE_ACT_MENU = 2;
Decim_InterfaceManager.prototype.STATE_HEAL_MENU = 3;
Decim_InterfaceManager.prototype.STATE_FIGHTING = 4;
Decim_InterfaceManager.prototype.STATE_VICTORY = 5;
Decim_InterfaceManager.prototype.STATE_VICTORY_DELAY = 3000;
Decim_InterfaceManager.prototype.STATE_CHECK = 6;
Decim_InterfaceManager.prototype.STATE_DIALOGUE = 7;
Decim_AttackManager.prototype.SEQUENCE_DELAY = 250;
Decim_AttackManager.prototype.SEQUENCE_LENGTH = 3;
Decim_Player.prototype.BOUNDARY_X = 198;
Decim_Player.prototype.BOUNDARY_Y = 596;
Decim_Player.prototype.BOUNDARY_WIDTH = 609;
Decim_Player.prototype.BOUNDARY_HEIGHT = 236;
Decim_Player.prototype.RADIUS = 10;
Decim_Player.prototype.MOVEMENT_SPEED = 3.0;
Decim_Player.prototype.HEALING_AMOUNT = 1.0;
Decim_Player.prototype.DAMAGE_DELAY = 700;

//Event Listeners
function decim_onkeydown(e) {
if (intro > 1) {
switch(interfaceManager.currentState) {
case interfaceManager.STATE_FIGHT:
	switch(e.keyCode) {
		case CODE_W: player.up = true; break;
		case CODE_UP: player.up = true; break;
		
		case CODE_A: player.left = true; break;
		case CODE_LEFT: player.left = true; break;
		
		case CODE_D: player.right = true; break;
		case CODE_RIGHT: player.right = true; break;
		
		case CODE_S: player.down = true; break;
		case CODE_DOWN: player.down = true; break;
		
		case CODE_ENTER: break;
	}
break;
case interfaceManager.STATE_MENU:
	switch(e.keyCode) {
		case CODE_A: interfaceManager.left(); break;
		case CODE_LEFT: interfaceManager.left(); break;
		
		case CODE_D: interfaceManager.right(); break;
		case CODE_RIGHT: interfaceManager.right(); break;
		
		case CODE_ENTER: interfaceManager.enter(); break;
	}
break;
case interfaceManager.STATE_ACT_MENU:
	switch(e.keyCode) {
		case CODE_A: interfaceManager.left(); break;
		case CODE_LEFT: interfaceManager.left(); break;
		
		case CODE_D: interfaceManager.right(); break;
		case CODE_RIGHT: interfaceManager.right(); break;
		
		case CODE_ENTER: interfaceManager.enter(); break;
	}
break;
case interfaceManager.STATE_HEAL_MENU:
	switch(e.keyCode) {
		case CODE_A: interfaceManager.left(); break;
		case CODE_LEFT: interfaceManager.left(); break;
		
		case CODE_D: interfaceManager.right(); break;
		case CODE_RIGHT: interfaceManager.right(); break;
		
		case CODE_ENTER: interfaceManager.enter(); break;
	}
break;
case interfaceManager.STATE_CHECK:
	switch(e.keyCode) {
		case CODE_A: interfaceManager.left(); break;
		case CODE_LEFT: interfaceManager.left(); break;
		
		case CODE_D: interfaceManager.right(); break;
		case CODE_RIGHT: interfaceManager.right(); break;
		
		case CODE_ENTER: interfaceManager.enter(); break;
	}
break;
case interfaceManager.STATE_DIALOGUE:
	switch(e.keyCode) {
		case CODE_ENTER: interfaceManager.enter(); break;
	}
break;
}
}
}

function decim_onkeyup(e) {
	switch(e.keyCode) {
		case CODE_W: player.up = false; break;
		case CODE_UP: player.up = false; break;
		
		case CODE_A: player.left = false; break;
		case CODE_LEFT: player.left = false; break;
		
		case CODE_D: player.right = false; break;
		case CODE_RIGHT: player.right = false; break;
		
		case CODE_S: player.down = false; break;
		case CODE_DOWN: player.down = false; break;
		
		case CODE_ENTER: break;
	}
}

function decim_tick() {
	switch(intro) {
		case 0:
			if (backgroundIntroAudio.currentTime < 19.979) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 19.98) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 20.22) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 20.46) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 20.70) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 20.94) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 21.18) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 21.42) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 21.66) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 21.90) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 22.14) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 22.38) introGlow = true;
	else	if (backgroundIntroAudio.currentTime < 22.62) introGlow = false;
	else	if (backgroundIntroAudio.currentTime < 22.86) introGlow = true;
		
			if (backgroundIntroAudio.currentTime > 22.3) {
				intro = 1;
			}
		break
		case 1:
			flashSize += 20;
			if (flashSize > 1100) {
				backgroundIntroAudio2.play();
				interfaceManager.currentState = interfaceManager.STATE_FIGHT;
				intro = 2;
			}
		break;
		case 2:
			introAlpha -= 0.01;
			if (introAlpha < 0) {
				introAlpha = 0;
				intro = 3;
			}
		break;
		case 3:
			if (backgroundIntroAudio2.paused) {
				backgroundAudio.play();
				intro = 4;
			}
		break;
	}
	decim.tick();
	projectileManager.tick();
	blasterManager.tick();
	interfaceManager.tick();
	attackManager.tick();
	player.tick();
}

function decim_render() {
	// Interface
	interface_canvas_context.clearRect(0,0,interface_canvas.width,interface_canvas.height);
	interface_buffer_context.clearRect(0,0,interface_buffer.width,interface_buffer.height);
	interfaceManager.render();
	interface_canvas_context.drawImage(interface_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Entities
	entities_canvas_context.clearRect(0,0,entities_canvas.width,entities_canvas.height);
	entities_buffer_context.clearRect(0,0,entities_buffer.width,entities_buffer.height);
	decim.render();
	entities_canvas_context.drawImage(entities_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Projectiles
	projectiles_canvas_context.clearRect(0,0,projectiles_canvas.width,projectiles_canvas.height);
	projectiles_buffer_context.clearRect(0,0,projectiles_buffer.width,projectiles_buffer.height);
	projectileManager.render();
	blasterManager.render();
	player.render();
	if (intro == 1 || intro == 2) {
		projectiles_buffer_context.fillStyle = 'rgba(255,255,255,'+introAlpha+')';
		projectiles_buffer_context.beginPath();
		projectiles_buffer_context.arc(495,100,flashSize,0,2 * Math.PI,false);
		projectiles_buffer_context.fill();
	}
	projectiles_canvas_context.drawImage(projectiles_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}