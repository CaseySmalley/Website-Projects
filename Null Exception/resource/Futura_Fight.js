function initFutura() {
	futuraAlive = false;

	overlayIMG = document.getElementById("overlay");
	interfaceIMG = document.getElementById("interface");
	resize();
	futura = new Body();
	projectileManager = new ProjectileManager();
	interfaceManager = new InterfaceManager();
	attackManager = new AttackManager();
	player = new Player();
	backgroundAudio = document.getElementById("futuraTheme");
	hitAudio = document.getElementById("hitAudio");
	weakenAudio = document.getElementById("weakenAudio");
	playerHealAudio = document.getElementById("medkitAudio");
	backgroundAudio.loop = true;
	weakenAudio.volume = 0.2;
	backgroundAudio.volume = 0.4;
	playerHealAudio.volume = 0.25;
	backgroundAudio.currentTime = 0;
	backgroundAudio.play();
	baseRendering();
}

function closeFutura() {
	delete overlayIMG;
	delete interfaceIMG;
	delete futurua;
	delete projectileManager;
	delete interfaceManager;
	delete attackManager;
	delete player;
	
	backgroundAudio.pause();
	hitAudio.pause();
	weakenAudio.pause();
	playerHealAudio.pause();
	
	delete backgroundAudio;
	delete hitAudio;
	delete weakenAudio;
	delete playerHealAudio;
}

function futura_resize() {
	CANVAS_WIDTH = window.innerWidth * 0.5;
	CANVAS_HEIGHT = window.innerHeight * 0.984;
	SCALE_X = CANVAS_WIDTH / IMAGE_WIDTH;
	SCALE_Y = CANVAS_HEIGHT / IMAGE_HEIGHT;
	if (hasSetup) {
		baseRendering();
	}
}

function baseRendering() {
	background_canvas.width = background_canvas.width;
	background_canvas_context.fillStyle = "#1a1a1a";
	background_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	background_canvas_context.drawImage(overlayIMG,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	background_canvas_context.drawImage(interfaceIMG,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

// Classes
function Body() {
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
	this.segments.push(new BodySegment("legs",0,this.height * 0.65,this.width,this.height,this,0,0));
	this.segments.push(new BodySegment("torso",0,0,this.width,this.height,this,3,0));
	this.segments.push(new BodySegment("head_frame_",0,-this.height * 0.55,this.width,this.height,this,4,6));
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

function BodySegment(id,x,y,width,height,parent,bobHeight,frameCount) {
	this.x = x + parent.x;
	this.y = y + parent.y;
	this.dx = ((Math.random() * 2) - 1) * 5;
	this.dy = -7.0;
	this.width = width;
	this.height = height;
	this.bob = 0;
	this.bobHeight = bobHeight;
	this.currentBob = 0;
	this.parent = parent;
	this.frameCount = frameCount;
	if (frameCount == 0) {
		this.image = document.getElementById(id);
	} else {
		this.frameCount -= 2;
		this.image = [];
		this.play = false;
		this.currentFrame = 0;
		this.lastFrame = Date.now();
		for (var i = 0 ; i < frameCount ; ++i) {
			this.image.push(document.getElementById(id + i));
		}
	}
	
	this.tick = function() {
		if (futura.health > 0.0) {
			if (!futura.beingDamaged) this.currentBob += this.BOB_SPEED;
			if (this.currentBob > 2 * Math.PI)
				this.currentBob = 0;
			this.bob = Math.sin(this.currentBob) * this.bobHeight;
		
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
		} else if (futura.health == 0 && !futura.beingDamaged) {
		this.dy += 0.3;
		this.y += this.dy;
		this.x += this.dx;
		}
	}
		
	this.render = function() {
		if (!futura.beingDamaged) {
			if (interfaceManager.currentState != interfaceManager.STATE_VICTORY) {
				if (frameCount == 0) {
					entities_buffer_context.drawImage(this.image,this.x,this.y + this.bob,this.width,this.height);
				} else {
					entities_buffer_context.drawImage(this.image[this.currentFrame],this.x,this.y + this.bob,this.width,this.height);
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
				entities_buffer_context.drawImage(this.image,this.x + (Math.sin(futura.damageBob) * futura.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
			} else {
				if (interfaceManager.currentState == interfaceManager.STATE_VICTORY)
					entities_buffer_context.drawImage(this.image[5],this.x + (Math.sin(futura.damageBob) * futura.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
				else
					entities_buffer_context.drawImage(this.image[4],this.x + (Math.sin(futura.damageBob) * futura.DAMAGE_BOB),this.y + this.bob,this.width,this.height);
			}
		}
	}
}

function ProjectileManager() {
	this.projectiles = [];
	this.stackCount = this.PROJECTILE_LIMIT;
	this.previousCount = 0;
	for (var i = 0 ; i < this.PROJECTILE_LIMIT ; ++i) {
		this.projectiles.push(new Projectile(0,0,this.PROJECTILE_RADIUS));
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

function Projectile(x,y,radius) {
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

function AttackManager() {
	
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
				case 0: this.leftCornerPattern(15); break;
				case 1: this.boxPatternRight(5,25,4); break;
				case 2: this.leftCornerPattern(20); break;
				case 3: this.boxPatternRight(5,25,4); break;
				case 4: this.leftCornerPattern(15); break;
				case 5: this.boxPatternRight(5,25,4); break;
				case 6: this.leftCornerPattern(20); break;
				case 7: this.boxPatternRight(5,25,4); break;
				case 8: this.leftCornerPattern(15); break;
				case 9: this.boxPatternRight(5,25,4); break;
				case 10: this.leftCornerPattern(20); break;
				case 11: this.boxPatternLeft(5,25,4); break;
				case 12: this.rightCornerPattern(15); break;
				case 13: this.boxPatternLeft(5,25,4); break;
				case 14: this.rightCornerPattern(20); break;
				case 15: this.boxPatternLeft(5,25,4); break;
				case 16: this.rightCornerPattern(15); break;
				case 17: this.boxPatternLeft(5,25,4); break;
				case 18: this.rightCornerPattern(20); break;
				case 19: this.boxPatternLeft(5,25,4); break;
				case 20: this.rightCornerPattern(15); break;
				case 21: this.boxPatternLeft(5,25,4); break;
				case 22: this.rightCornerPattern(20); break;
				
				case 30: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence1 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 1: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 2: this.leftCornerPattern(20); this.rightCornerPattern(15); break;
				case 3: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 4: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 5: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 6: this.leftCornerPattern(20); this.rightCornerPattern(15); break;
				case 7: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 8: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 9: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 10: this.leftCornerPattern(20); this.rightCornerPattern(15); break;
				case 11: this.boxPatternLeft(5,25,4); this.boxPatternRight(5,25,4); break;
				case 18: this.breakSequence(); break;
			}
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence2 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 2: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 4: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 6: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 8: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 10: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 12: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 14: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 16: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 18: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 20: this.leftCornerPattern(15); this.rightCornerPattern(20); break;
				case 22: this.semiCirclePattern(player.BOUNDARY_X + (player.BOUNDARY_WIDTH/2),15); break;
				case 30: this.breakSequence(); break;
			}
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence3 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 1: this.boxPatternRight(5,25,2); this.boxPatternRight(125,25,5); break;
				case 2: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 3: this.boxPatternRight(5,25,2); this.boxPatternRight(125,25,5); break;
				case 4: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 5: this.boxPatternRight(5,25,2); this.boxPatternRight(125,25,5); break;
				case 6: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 7: this.boxPatternRight(5,25,2); this.boxPatternRight(125,25,5); break;
				case 8: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 9: this.boxPatternRight(5,25,2); this.boxPatternRight(125,25,5); break;
				case 10: this.rightCornerPattern(20); this.leftCornerPattern(15); break;
				case 11: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 12: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				case 13: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 14: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				case 15: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 16: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				case 17: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 18: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				case 19: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 20: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				case 21: this.boxPatternLeft(5,25,4); this.boxPatternLeft(175,25,4); break;
				case 22: this.rightCornerPattern(15); this.leftCornerPattern(18); break;
				
				case 30: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence4 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.boxPatternRight(10,25,5); break;
				case 1: this.boxPatternLeft(125,25,5); break;
				case 2: this.boxPatternRight(10,25,5); break;
				case 3: this.boxPatternLeft(125,25,5); break;
				case 4: this.boxPatternRight(10,25,5); break;
				case 5: this.boxPatternLeft(125,25,5); break;
				case 6: this.boxPatternRight(10,25,5); break;
				case 7: this.boxPatternLeft(125,25,5); break;
				case 8: this.boxPatternRight(10,25,5); break;
				case 9: this.boxPatternLeft(125,25,5); break;
				case 10: this.boxPatternRight(10,25,5); break;
				case 11: this.boxPatternLeft(125,25,5); break;
				case 12: this.boxPatternRight(10,25,5); break;
				case 13: this.boxPatternLeft(125,25,5); break;
				case 14: this.boxPatternRight(10,25,5); break;
				case 15: this.boxPatternLeft(125,25,5); break;
				case 16: this.boxPatternRight(10,25,5); break;
				case 17: this.boxPatternLeft(125,25,5); break;
				case 18: this.boxPatternRight(10,25,5); break;
				case 19: this.boxPatternLeft(125,25,5); break;
				case 20: this.boxPatternRight(10,25,5); break;
				case 21: this.boxPatternLeft(125,25,5); break;
				case 22: this.boxPatternRight(10,25,5); break;
				case 23: this.boxPatternLeft(125,25,5); break;
				case 24: this.boxPatternRight(10,25,5); break;
				case 25: this.boxPatternLeft(125,25,5); break;
				case 26: this.boxPatternRight(10,25,5); break;
				case 27: this.boxPatternLeft(125,25,5); break;
				
				case 35: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence5 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 2: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 4: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 6: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 8: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 10: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 12: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 14: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 16: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 18: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 20: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 22: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 24: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 26: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 28: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 30: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 32: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 34: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 36: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 38: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 40: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 42: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 44: this.boxPatternRight(5,25,2); this.boxPatternRight(100,25,6); break;
				case 46: this.boxPatternRight(5,25,6); this.boxPatternRight(200,25,2); break;
				case 50: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 52: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 54: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 56: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 58: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 60: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 62: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 64: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 66: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 68: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 70: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 72: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 74: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 76: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 78: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 80: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 82: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 84: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 86: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 88: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 80: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 82: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 84: this.boxPatternLeft(5,25,2); this.boxPatternLeft(100,25,6); break;
				case 86: this.boxPatternLeft(5,25,6); this.boxPatternLeft(200,25,2); break;
				case 93: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence6 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 2: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 4: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 6: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 8: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 10: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 12: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 14: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 16: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 18: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 20: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 22: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 24: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 26: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 28: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 30: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 32: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 34: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 36: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 38: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 40: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 42: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 44: this.boxPatternLeft(5,25,2); this.boxPatternRight(100,25,6); break;
				case 46: this.boxPatternLeft(5,25,6); this.boxPatternRight(200,25,2); break;
				case 55: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence7 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.linePattern(5,25,8,4); break;
				case 1: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 2: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 3: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 4: this.linePattern(50,25,8,4); break;
				case 5: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 6: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 7: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 8: this.linePattern(5,25,8,4); break;
				
				case 9: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 10: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 11: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 12: this.linePattern(50,25,8,4); break;
				case 13: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 14: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 15: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 16: this.linePattern(5,25,8,4); break;
				
				case 17: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 18: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 19: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 20: this.linePattern(50,25,8,4); break;
				case 21: this.linePattern(5,25,2,4); this.linePattern(100,25,6,4); break;
				case 22: this.linePattern(5,25,4,4); this.linePattern(150,25,4,4); break;
				case 23: this.linePattern(5,25,6,4); this.linePattern(200,25,2,4); break;
				case 24: this.linePattern(5,25,8,4); break;
				
				case 32: this.linePattern(5,25,8,-4); break;
				case 33: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 34: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 35: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 36: this.linePattern(50,25,8,-4); break;
				case 37: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 38: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 39: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 40: this.linePattern(5,25,8,-4); break;
				
				case 41: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 42: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 43: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 44: this.linePattern(50,25,8,-4); break;
				case 45: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 46: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 47: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 48: this.linePattern(5,25,8,-4); break;
				
				case 49: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 50: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 51: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 52: this.linePattern(50,25,8,-4); break;
				case 53: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 54: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 55: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 56: this.linePattern(5,25,8,-4); break;
				
				case 57: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 58: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 59: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 60: this.linePattern(50,25,8,-4); break;
				case 61: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 62: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 63: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 64: this.linePattern(5,25,8,-4); break;
			
				case 65: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 66: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 67: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 68: this.linePattern(50,25,8,-4); break;
				case 69: this.linePattern(5,25,2,-4); this.linePattern(100,25,6,-4); break;
				case 70: this.linePattern(5,25,4,-4); this.linePattern(150,25,4,-4); break;
				case 71: this.linePattern(5,25,6,-4); this.linePattern(200,25,2,-4); break;
				case 72: this.linePattern(5,25,8,-4); break;
				case 76: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence8 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.angleLinePattern(10,50,0.5,14,2); break;
				case 1: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 2: this.angleLinePattern(10,50,0.5,14,2); break;
				case 3: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 4: this.angleLinePattern(10,50,0.5,14,2); break;
				case 5: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 6: this.angleLinePattern(10,50,0.5,14,2); break;
				case 7: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 8: this.angleLinePattern(10,50,0.5,14,2); break;
				case 9: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 10: this.angleLinePattern(10,50,0.5,14,2); break;
				case 11: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 12: this.angleLinePattern(10,50,0.5,14,2); break;
				case 13: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 14: this.angleLinePattern(10,50,0.5,14,2); break;
				case 15: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 16: this.angleLinePattern(10,50,0.5,14,2); break;
				case 17: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 18: this.angleLinePattern(10,50,0.5,14,2); break;
				case 19: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 20: this.angleLinePattern(10,50,0.5,14,2); break;
				case 21: this.angleLinePattern(45,50,-0.5,14,2); break;
				case 25: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.sequence9 = function() {
		if (Date.now() - this.lastSequence > this.SEQUENCE_DELAY) {
			switch(this.sequenceAttackCount) {
				case 0: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 1: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 2: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 3: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 4: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 5: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 6: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 7: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 8: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 9: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 10: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 11: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 12: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 13: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 14: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 15: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 16: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 17: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 18: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 19: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 20: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 21: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 22: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 23: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 24: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 25: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 26: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0); break;
				case 27: this.angleLinePattern(25,25,-0.5,7,4); this.angleLinePattern(425,25,0.5,7,4); this.semiCirclePatternOffset(player.BOUNDARY_X + (player.BOUNDARY_WIDTH / 2),13,0.1); break;
				case 35: this.breakSequence(); break;
			}
			
			++this.sequenceAttackCount;
			this.lastSequence = Date.now();
		}
	}
	
	this.convertAngle = function(degrees) {
		return degrees * (Math.PI / 180.0);
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

function InterfaceManager() {
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
					case 0: this.currentState = this.STATE_FIGHT; futura.damage(); player.resetPosition();break;
					case 1: this.currentState = this.STATE_ACT_MENU; this.selectedButton = 0; this.buttonLimit = 3; break;
					case 2: this.currentState = this.STATE_HEAL_MENU; this.selectedButton = 0; this.buttonLimit = 1; break; 
				}
			break;
			case this.STATE_ACT_MENU:
				switch(this.selectedButton) {
					case 0: this.currentState = this.STATE_FIGHT; this.selectedButton = 0; this.buttonLimit = 2;  player.resetPosition(); futura.damageAttack(); this.dialogueMessage("/n/n Futara's Attack Dropped!"); break;
					case 1: this.currentState = this.STATE_FIGHT; this.selectedButton = 0; this.buttonLimit = 2;  player.resetPosition(); futura.damageArmor();  this.dialogueMessage("/n/n Futara's Defense Dropped!");break;
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
	interface_buffer_context.fillRect(this.HEALTH_X - 2.5,this.HEALTH_FUTURA_Y - 2.5,this.HEALTH_WIDTH + 5,this.HEALTH_HEIGHT + 5);
	interface_buffer_context.fillStyle = '#000000';
	interface_buffer_context.fillRect(this.HEALTH_X,this.HEALTH_FUTURA_Y,this.HEALTH_WIDTH,this.HEALTH_HEIGHT);
	interface_buffer_context.fillStyle = '#000080';
	interface_buffer_context.fillRect(this.HEALTH_X,this.HEALTH_FUTURA_Y,this.HEALTH_WIDTH * futura.health,this.HEALTH_HEIGHT);
	switch(this.currentState) {
		case this.STATE_MENU:
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
			interface_buffer_context.fillText("Attack: "+ parseInt(futura.attack * 100)+"%",player.BOUNDARY_X + 150,this.MENU_ACT_Y + 90);
			interface_buffer_context.fillText("Defense: "+ (parseInt(futura.armor * 100))+"%",player.BOUNDARY_X + 150,this.MENU_ACT_Y + 160);
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

function Player() {
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
		if (!this.invincible) {
			this.invincible = true;
			overworld_player.health -= futura.attack;
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
ProjectileManager.prototype.collision = function(x1,y1,x2,y2,radius) {
	var distance = (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
	return distance < radius * radius;
}
Body.prototype.DAMAGE_BOB = 30;
Body.prototype.DAMAGE_BOB_LIMIT = 4 * Math.PI;
Body.prototype.DAMAGE_ACC = 0.15;
Body.prototype.FALL_SPEED = 3.0;
Body.prototype.DEFAULT_ARMOR = 0.9;
Body.prototype.DEFAULT_ATTACK = 0.1;
BodySegment.prototype.ANIMATION_DELAY = 5000;
BodySegment.prototype.FRAME_TIME = 50;
BodySegment.prototype.BOB_SPEED = 0.1;
ProjectileManager.prototype.PROJECTILE_LIMIT = 100;
ProjectileManager.prototype.PROJECTILE_RADIUS = 5;
ProjectileManager.prototype.PROJECTILE_BOUNDARY_X = 198;
ProjectileManager.prototype.PROJECTILE_BOUNDARY_Y = 596;
ProjectileManager.prototype.PROJECTILE_BOUNDARY_WIDTH = 609;
ProjectileManager.prototype.PROJECTILE_BOUNDARY_HEIGHT = 236;
InterfaceManager.prototype.BUTTON_WIDTH = 215;
InterfaceManager.prototype.BUTTON_HEIGHT = 65;
InterfaceManager.prototype.BUTTON_Y = 900;
InterfaceManager.prototype.BUTTON_FIGHT_X = 152;
InterfaceManager.prototype.BUTTON_ACT_X = 391;
InterfaceManager.prototype.BUTTON_HEAL_X = 630;
InterfaceManager.prototype.HEALTH_X = 264;
InterfaceManager.prototype.HEALTH_Y = 869;
InterfaceManager.prototype.HEALTH_WIDTH = 476;
InterfaceManager.prototype.HEALTH_HEIGHT = 12;
InterfaceManager.prototype.HEALTH_FUTURA_Y = 15;
InterfaceManager.prototype.HEALTH_WIDTH = 476;
InterfaceManager.prototype.HEALTH_HEIGHT = 12;
InterfaceManager.prototype.MENU_HEAL_X = 200;
InterfaceManager.prototype.MENU_HEAL_Y = 300;
InterfaceManager.prototype.MENU_HEAL_WIDTH = 600;
InterfaceManager.prototype.MENU_HEAL_HEIGHT = 250;
InterfaceManager.prototype.BUTTON_HEAL_DO_X = 240;
InterfaceManager.prototype.BUTTON_HEAL_DO_Y = 450;
InterfaceManager.prototype.BUTTON_HEAL_DONT_X = 550;
InterfaceManager.prototype.BUTTON_HEAL_DONT_Y = 450;
InterfaceManager.prototype.MENU_ACT_X = 200;
InterfaceManager.prototype.MENU_ACT_Y = 320;
InterfaceManager.prototype.MENU_ACT_WIDTH = 600;
InterfaceManager.prototype.MENU_ACT_HEIGHT = 220;
InterfaceManager.prototype.BUTTON_ACT_DO_X = 240;
InterfaceManager.prototype.BUTTON_ACT_DO_Y = 450;
InterfaceManager.prototype.BUTTON_ACT_DONT_X = 550;
InterfaceManager.prototype.BUTTON_ACT_DONT_Y = 450;
InterfaceManager.prototype.DIALOGUE_LENGTH = 100;
InterfaceManager.prototype.STATE_MENU = 0;
InterfaceManager.prototype.STATE_FIGHT_MENU = 1;
InterfaceManager.prototype.STATE_ACT_MENU = 2;
InterfaceManager.prototype.STATE_HEAL_MENU = 3;
InterfaceManager.prototype.STATE_FIGHTING = 4;
InterfaceManager.prototype.STATE_VICTORY = 5;
InterfaceManager.prototype.STATE_VICTORY_DELAY = 3000;
InterfaceManager.prototype.STATE_CHECK = 6;
InterfaceManager.prototype.STATE_DIALOGUE = 7;
AttackManager.prototype.SEQUENCE_DELAY = 500;
AttackManager.prototype.SEQUENCE_LENGTH = 3;
Player.prototype.BOUNDARY_X = 198;
Player.prototype.BOUNDARY_Y = 596;
Player.prototype.BOUNDARY_WIDTH = 609;
Player.prototype.BOUNDARY_HEIGHT = 236;
Player.prototype.RADIUS = 10;
Player.prototype.MOVEMENT_SPEED = 3.0;
Player.prototype.HEALING_AMOUNT = 1.0;
Player.prototype.DAMAGE_DELAY = 700;

//Event Listeners
function futura_onkeydown(e) {
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

function futura_onkeyup(e) {
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

function futura_tick() {
	futura.tick();
	projectileManager.tick();
	interfaceManager.tick();
	attackManager.tick();
	player.tick();
}

function futura_render() {
	// Interface
	interface_canvas_context.clearRect(0,0,interface_canvas.width,interface_canvas.height);
	interface_buffer_context.clearRect(0,0,interface_buffer.width,interface_buffer.height);
	interfaceManager.render();
	interface_canvas_context.drawImage(interface_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Entities
	entities_canvas_context.clearRect(0,0,entities_canvas.width,entities_canvas.height);
	entities_buffer_context.clearRect(0,0,entities_buffer.width,entities_buffer.height);
	futura.render();
	entities_canvas_context.drawImage(entities_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Projectiles
	projectiles_canvas_context.clearRect(0,0,projectiles_canvas.width,projectiles_canvas.height);
	projectiles_buffer_context.clearRect(0,0,projectiles_buffer.width,projectiles_buffer.height);
	projectileManager.render();
	player.render();
	projectiles_canvas_context.drawImage(projectiles_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}