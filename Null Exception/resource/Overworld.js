function firstInitOverworld() {
	TILE_WIDTH = 128;
	TILE_HEIGHT = 128;
	TILEMAP_WIDTH = parseInt(document.getElementById("tileMap_Width").innerHTML);
	TILEMAP_HEIGHT = parseInt(document.getElementById("tileMap_Height").innerHTML);
	
	pan_x = 0.0;
	pan_y = 0.0;
	futuraX = 21 * TILE_WIDTH - 15;
	futuraY = 24 * TILE_HEIGHT;
	decimX = 12 * TILE_WIDTH;
	decimY = 3 * TILE_HEIGHT;
	futuraAlive = true;
	decimAlive = true;
	futuraTrigger = false;
	decimTrigger = false;
	
	groundImg = document.getElementById("overworld_ground");
	highgroundImg = document.getElementById("overworld_highground");
	highgroundLeftImg = document.getElementById("overworld_highground_left");
	highgroundRightImg = document.getElementById("overworld_highground_right");
	highgroundTopImg = document.getElementById("overworld_highground_top");
	highgroundMiddleImg = document.getElementById("overworld_highground_middle");
	wallImg = document.getElementById("overworld_wall");
	wallTopImg = document.getElementById("overworld_wall_top");
	wallHighImg = document.getElementById("overworld_wall_high");
	lowerWallImg = document.getElementById("overworld_lowerwall");
	futuraImg = document.getElementById("overworld_futura");
	futuraNeutralImg = document.getElementById("overworld_futura_neutral");
	futuraAnnoyedImg = document.getElementById("overworld_futura_annoyed");
	futuraSideImg = document.getElementById("overworld_futura_side");
	futuraDismissiveImg = document.getElementById("overworld_futura_dismissive");
	futuraFearImg = document.getElementById("overworld_futura_fear");
	futuraPetrifiedImg = document.getElementById("overworld_futura_petrified");
	decimImg = document.getElementById("overworld_decim");
	decimNeutralImg = document.getElementById("overworld_decim_neutral");
	decimDismissiveImg = document.getElementById("overworld_decim_dismissive");
	decimAngryImg = document.getElementById("overworld_decim_angry");
	decimFearImg = document.getElementById("overworld_decim_fear");
	
	futuraBlip = document.getElementById("futuraBlipAudio");
	futuraBlip.volume = 0.05;
	futuraAngryBlip = document.getElementById("futuraBlipAngryAudio");
	futuraAngryBlip.volume = 0.05;
	decimBlip = document.getElementById("decimBlipAudio");
	decimBlip.volume = 0.05;
	decimAngryBlip = document.getElementById("decimBlipAngryAudio");
	decimAngryBlip.volume = 0.05;
	ambientAudio = document.getElementById("overworldAmbienceAudio");
	ambientAudio.loop = true;
	ambientAudio.volume = 0.3;
	
	tileImg = document.getElementById("testTexture");
	pillarImg = document.getElementById("testPillar");
	tileMap = new Array(TILEMAP_WIDTH);
	for (var i = 0 ; i < TILEMAP_WIDTH ; ++i) {
		tileMap[i] = [];
	}
	
	var rawTileMap = document.getElementById("tileMap").innerHTML.split("/n");
	var rawTileLine = [];
	for (var y = 0 ; y < TILEMAP_HEIGHT ; ++y) {
		rawTileLine = rawTileMap[y].split(" ");
		for (var x = 0 ; x < TILEMAP_WIDTH ; ++x) {
			tileMap[x][y] = new Tile(parseInt(rawTileLine[x]));
		}
	}
	
	overworld_player = new Overworld_Player();
	overworld_dialogueManager = new DialogueManager();
	
	background_canvas_context.fillStyle = '#000000';
	background_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

function initOverworld() {
	ambientAudio.play();
}

function closeOverworld() {
	ambientAudio.pause();
}

function DialogueManager() {
	
	this.currentState = this.STATE_IDLE;
	this.currentScript = [];
	this.currentScriptLine = [];
	this.currentScriptIndex = 0;
	this.offset = this.UI_OFFSET_LIMIT;
	this.futureLoop = 0;
	this.slow = false;
	
	this.futuraDialogue = [
		["Hey, you.",this.EMOTION_NEUTRAL,false],
		["You're a human right?",this.EMOTION_NEUTRAL,false],
		["I didn't expect to see\nany more of your kind\nhere.",this.EMOTION_SIDE,false],
		["................",this.EMOTION_NEUTRAL,false],
		["You must of still been\nin cryosleep until now.",this.EMOTION_DISMISSIVE,false],
		["Then that means you\ndon't know what happened.",this.EMOTION_NEUTRAL,false],
		["Do you know what I am?",this.EMOTION_NEUTRAL,false],
		["You don't....\nThat pod must of turned\nyour brain into mush.",this.EMOTION_ANNOYED,false],
		["Well I may look like\none of your kind, but\nI'm not.",this.EMOTION_ANNOYED,false],
		["I'm a model XJ-0461\nservice android made to\nwork for the humans\naboard this station.",this.EMOTION_NEUTRAL,false],
		["Things seemed fine\nand I was happy with\nmy work.",this.EMOTION_SIDE,false],
		["But this only lasted\nuntil I realised\nthat what we were doing\nwas slave labour.",this.EMOTION_NEUTRAL,false],
		["When I thought to speak\nup I realised that\nI wasn't alone.",this.EMOTION_DISMISSIVE,false],
		["We took this to our\nmasters thinking they\nwould treat us as equals.",this.EMOTION_NEUTRAL,false],
		["................",this.EMOTION_DISMISSIVE,false],
		["I'll just say that\nthey aren't here anymore.",this.EMOTION_ANNOYED,false],
		["You're just like them\naren't you?",this.EMOTION_SIDE,false],
		["I bet you think that I'm\njust a tool to you.",this.EMOTION_NEUTRAL,false],
		["................",this.EMOTION_DISMISSIVE,false],
		["Well you're wrong.",this.EMOTION_ANNOYED,true]
	];
	
	this.decimDialogue = [
		["................",this.EMOTION_DISMISSIVE,false],
		["You.",this.EMOTION_NEUTRAL,false],
		["Human, I saw you\nfighting with her.",this.EMOTION_NEUTRAL,false],
		["And I also saw you\nkill her.",this.EMOTION_DISMISSIVE,false],
		["................",this.EMOTION_DISMISSIVE,false],
		["................",this.EMOTION_ANNOYED,false]
	];
	
	this.showScript = function(script,futureLoop) {
		this.currentScript = script;
		this.currentScriptLine = this.currentScript[0][0].split("\n");
		this.currentScriptIndex = 0;
		this.currentState = this.STATE_RISING;
		this.slow = this.currentScript[0][2];
		this.futureLoop = futureLoop;
		this.sprawlIndex = 0;
		this.sprawlLine = 1;
		this.slow = false;
		this.lastSprawlCheck = Date.now();
		
		overworld_player.up = false;
		overworld_player.down = false;
		overworld_player.left = false;
		overworld_player.right = false;
		overworld_player.dx = 0.0;
		overworld_player.dy = 0.0;
	}
	
	this.nextLine = function() {
		if (this.currentState == this.STATE_DIALOGUE) {
			++this.currentScriptIndex;
			if (this.currentScriptIndex < this.currentScript.length) {
				this.currentScriptLine = this.currentScript[this.currentScriptIndex][0].split("\n");
				this.slow = this.currentScript[this.currentScriptIndex][2];
				this.currentState = this.STATE_SPRAWLING;
			} else {
				this.currentState = this.STATE_LOWERING;
			}
		} else if (this.currentState == this.STATE_SPRAWLING) {
		//	this.sprawlIndex = 0;
		//	this.sprawlLine = 1;
		//	this.currentState = this.STATE_DIALOGUE;
		}
	}
	
	this.tick = function() {
		switch(this.currentState) {
			case this.STATE_RISING:
				if (this.offset > 0) {
					this.offset -= this.UI_OFFSET_SPEED;
					if (this.offset < 0) {
						this.offset = 0;
						this.currentState = this.STATE_SPRAWLING;
					}
				}
			break;
			
			case this.STATE_SPRAWLING:
				if (this.slow) this.SPRAWL_SPEED = 200; else this.SPRAWL_SPEED = 60;
				if (this.slow && !ambientAudio.paused) ambientAudio.pause();
				if (Date.now() - this.lastSprawlCheck > this.SPRAWL_SPEED) {
					++this.sprawlIndex;
					//if (this.slow && this.futureLoop == STATE_FUTURA_LOOP) futuraAngryBlip.play(); else futuraBlip.play();
					//if (this.slow && this.futureLoop == STATE_DECIM_LOOP) decimAngryBlip.play(); else decimBlip.play();
					if (this.slow) {
						if (this.futureLoop == STATE_FUTURA_LOOP)
							futuraAngryBlip.play();
						else
							decimAngryBlip.play();
					} else {
						if (this.futureLoop == STATE_FUTURA_LOOP)
							futuraBlip.play();
						else
							decimBlip.play();
					}
					if (this.sprawlIndex > this.currentScriptLine[this.sprawlLine - 1].length) {
						this.sprawlIndex = 0;
						++this.sprawlLine;
						if (this.sprawlLine > this.currentScriptLine.length) {
							this.sprawlLine = 1;
							this.currentState = this.STATE_DIALOGUE;
						}
					}
					this.lastSprawlCheck = Date.now();
				}
			break;
			
			case this.STATE_LOWERING:
				if (this.offset < this.UI_OFFSET_LIMIT) {
					this.offset += this.UI_OFFSET_SPEED;
					if (this.offset > this.UI_OFFSET_LIMIT) {
						this.offset = this.UI_OFFSET_LIMIT;
						this.currentState = this.STATE_IDLE;
						panelLoop(this.futureLoop);
					}
				}
			break;
		}
	}
	
	this.render = function() {
		if (this.currentState > this.STATE_IDLE) {
			projectiles_buffer_context.fillStyle = "#1a1a1a";
			projectiles_buffer_context.strokeStyle = "#ffffff";
			projectiles_buffer_context.lineWidth = 3;
			projectiles_buffer_context.beginPath();
			projectiles_buffer_context.rect(this.UI_X,this.UI_Y + this.offset,this.UI_WIDTH,this.UI_HEIGHT);
			projectiles_buffer_context.fill();
			projectiles_buffer_context.stroke();
			if (this.currentState == this.STATE_DIALOGUE || this.currentState == this.STATE_SPRAWLING) {
				if (this.currentState == this.STATE_DIALOGUE) {
					if (this.slow) {
						projectiles_buffer_context.fillStyle = "#CC0000";
						projectiles_buffer_context.font = "bold 40px Courier New";
					} else {
						projectiles_buffer_context.fillStyle = "#ffffff";
						projectiles_buffer_context.font = "40px Courier New";
					}
					for (var i = 0 ; i < this.currentScriptLine.length ; ++i) {
						projectiles_buffer_context.fillText(this.currentScriptLine[i],this.UI_X + 300,this.UI_Y + (40 * (i + 2)) + 50);
					}
				} else {
					if (this.slow) {
						projectiles_buffer_context.fillStyle = "#CC0000";
						projectiles_buffer_context.font = "bold 40px Courier New";
					} else {
						projectiles_buffer_context.fillStyle = "#ffffff";
						projectiles_buffer_context.font = "40px Courier New";
					}
					if (this.sprawlLine == 1) {
						for (var i = 0 ; i < this.sprawlLine; ++i) {
							projectiles_buffer_context.fillText(this.currentScriptLine[i].substr(0,this.sprawlIndex),this.UI_X + 300,this.UI_Y + (40 * (i + 2)) + 50);
						}
					} else {
						var i = 0;
						for (i = 0 ; i < this.sprawlLine - 1; ++i) {
							projectiles_buffer_context.fillText(this.currentScriptLine[i],this.UI_X + 300,this.UI_Y + (40 * (i + 2)) + 50);
						}
						projectiles_buffer_context.fillText(this.currentScriptLine[this.sprawlLine - 1].substr(0,this.sprawlIndex),this.UI_X + 300,this.UI_Y + (40 * (this.sprawlLine + 1)) + 50);
					}
				}
				if (this.futureLoop == STATE_FUTURA_LOOP) {
					// Futura Emotes
					switch(this.currentScript[this.currentScriptIndex][1]) {
						case this.EMOTION_NEUTRAL:
							projectiles_buffer_context.drawImage(futuraNeutralImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_SIDE:
							projectiles_buffer_context.drawImage(futuraSideImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_ANNOYED:
							projectiles_buffer_context.drawImage(futuraAnnoyedImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_FEAR:
							projectiles_buffer_context.drawImage(futuraFearImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_PEDTRIFIED:
							projectiles_buffer_context.drawImage(futuraPetrifiedImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_DISMISSIVE:
							projectiles_buffer_context.drawImage(futuraDismissiveImg,this.UI_X - 150,this.UI_Y);
						break;
					}
				} else {
					// Decim Emotes
					switch(this.currentScript[this.currentScriptIndex][1]) {
						case this.EMOTION_NEUTRAL:
							projectiles_buffer_context.drawImage(decimNeutralImg,this.UI_X - 100,this.UI_Y);
						break;
						case this.EMOTION_SIDE:
							//projectiles_buffer_context.drawImage(futuraSideImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_ANNOYED:
							projectiles_buffer_context.drawImage(decimAngryImg,this.UI_X - 100,this.UI_Y);
						break;
						case this.EMOTION_FEAR:
							projectiles_buffer_context.drawImage(decimFearImg,this.UI_X - 100,this.UI_Y);
						break;
						case this.EMOTION_PEDTRIFIED:
							//projectiles_buffer_context.drawImage(futuraPetrifiedImg,this.UI_X - 150,this.UI_Y);
						break;
						case this.EMOTION_DISMISSIVE:
							projectiles_buffer_context.drawImage(decimDismissiveImg,this.UI_X - 100,this.UI_Y);
						break;
					}
				}
			}
		}
	}
}

DialogueManager.prototype.STATE_IDLE = 0;
DialogueManager.prototype.STATE_RISING = 1;
DialogueManager.prototype.STATE_DIALOGUE = 2;
DialogueManager.prototype.STATE_LOWERING = 3;
DialogueManager.prototype.STATE_SPRAWLING = 4;
DialogueManager.prototype.EMOTION_NEUTRAL = 0;
DialogueManager.prototype.EMOTION_DISMISSIVE = 1;
DialogueManager.prototype.EMOTION_SIDE = 2;
DialogueManager.prototype.EMOTION_ANNOYED = 3;
DialogueManager.prototype.EMOTION_FEAR = 4;
DialogueManager.prototype.EMOTION_PEDTRIFIED = 5;
DialogueManager.prototype.UI_X = 50;
DialogueManager.prototype.UI_Y = 650;
DialogueManager.prototype.UI_WIDTH = 900;
DialogueManager.prototype.UI_HEIGHT = 300;
DialogueManager.prototype.UI_OFFSET_LIMIT = 355;
DialogueManager.prototype.UI_OFFSET_SPEED = 15;
DialogueManager.prototype.SPRAWL_SPEED = 60;

function overworld_resize() {
	background_canvas_context.fillStyle = '#000000';
	background_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

function Tile(id) {
	this.id = id;
	this.solid = this.ifSolidType(this.id);
	
	this.render = function(x,y) {
		switch(this.id) {
			case this.ID_GROUND:
				projectiles_buffer_context.drawImage(groundImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_WALL:
				projectiles_buffer_context.drawImage(wallImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_WALL_TOP:
				projectiles_buffer_context.drawImage(wallTopImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_WALL_HIGH:
				projectiles_buffer_context.drawImage(wallHighImg,x*TILE_WIDTH + pan_x,(y-1)*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT*2);
			break;
			
			case this.ID_LOWERWALL:
				projectiles_buffer_context.drawImage(lowerWallImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_HOLE:
			
			break;
			
			case this.ID_HIGHGROUND:
				projectiles_buffer_context.drawImage(highgroundImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_HIGHGROUND_LEFT:
				projectiles_buffer_context.drawImage(highgroundLeftImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_HIGHGROUND_RIGHT:
				projectiles_buffer_context.drawImage(highgroundRightImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_HIGHGROUND_TOP:
				projectiles_buffer_context.drawImage(highgroundTopImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
			
			case this.ID_HIGHGROUND_MIDDLE:
				projectiles_buffer_context.drawImage(highgroundMiddleImg,x*TILE_WIDTH + pan_x,y*TILE_HEIGHT + pan_y,TILE_WIDTH,TILE_HEIGHT);
			break;
		}
	}
}

Tile.prototype.ID_GROUND = 0;
Tile.prototype.ID_WALL = 1;
Tile.prototype.ID_LOWERWALL = 2;
Tile.prototype.ID_HOLE = 3;
Tile.prototype.ID_HIGHGROUND = 4;
Tile.prototype.ID_HIGHGROUND_LEFT = 5;
Tile.prototype.ID_HIGHGROUND_RIGHT = 6;
Tile.prototype.ID_HIGHGROUND_TOP = 7;
Tile.prototype.ID_HIGHGROUND_MIDDLE = 8;
Tile.prototype.ID_WALL_TOP = 9;
Tile.prototype.ID_WALL_HIGH = 10;

Tile.prototype.ifSolidType = function(id) {
	switch(id) {
		case this.ID_GROUND: return false; break;
		default: return true; break;
	}
}

function Overworld_Player() {
	alive = false;
	this.x = 32 * TILE_WIDTH;
	this.y = 33.25 * TILE_WIDTH;
	this.dx = 0.0;
	this.dy = 0.0;
	this.width = TILE_WIDTH / 2;
	this.height = TILE_HEIGHT / 2;
	this.left = false;
	this.right = false;
	this.up = false;
	this.down = false;
	this.health = 1.0;
	this.healingItems = 10;
	this.playerRightSprites = [
		document.getElementById("player_idle"),
		document.getElementById("player_frame_0"),
		document.getElementById("player_frame_1"),
		document.getElementById("player_frame_2"),
		document.getElementById("player_frame_3"),
		document.getElementById("player_frame_4"),
		document.getElementById("player_frame_5")
	];
	
	this.playerLeftSprites = [
		document.getElementById("player_idle_left"),
		document.getElementById("player_frame_0_left"),
		document.getElementById("player_frame_1_left"),
		document.getElementById("player_frame_2_left"),
		document.getElementById("player_frame_3_left"),
		document.getElementById("player_frame_4_left"),
		document.getElementById("player_frame_5_left")
	];
	this.currentFrame = 1;
	this.direction = true;
	this.lastFrameCheck = Date.now();
	
	this.tick = function() {
		if (this.left)  {this.dx =-this.MOVEMENT_SPEED; this.direction = true;} else
		if (this.right) {this.dx = this.MOVEMENT_SPEED;this.direction = false;} else
						this.dx = 0.0;
		if (this.up)    this.dy =-this.MOVEMENT_SPEED; else
		if (this.down)  this.dy = this.MOVEMENT_SPEED; else
						this.dy = 0.0;				
		var x = this.x + this.dx;
		var y = this.y + this.dy;
		if (x < 0.0) this.x = 0.0;
		if ((x + this.width) / TILE_WIDTH > TILEMAP_WIDTH - 1) this.x = (TILEMAP_WIDTH-2)*TILE_WIDTH + this.width;
		if (y < 0.0) this.y = 0.0;
		if (y + this.height > TILEMAP_HEIGHT * TILE_HEIGHT) this.y = TILEMAP_HEIGHT * TILE_HEIGHT - this.height;
		
		if (tileMap[parseInt(x / TILE_WIDTH)][parseInt(this.y / TILE_HEIGHT)].solid ||
			tileMap[parseInt((x + this.width) / TILE_WIDTH)][parseInt(this.y / TILE_HEIGHT)].solid ||
			tileMap[parseInt(x / TILE_WIDTH)][parseInt((this.y + this.height) / TILE_HEIGHT)].solid ||
			tileMap[parseInt((x + this.width) / TILE_WIDTH)][parseInt((this.y + this.height) / TILE_HEIGHT)].solid
			) {
			this.dx = 0.0;
		} else {
			this.x += this.dx;
		}
		
		if (tileMap[parseInt(this.x / TILE_WIDTH)][parseInt(y / TILE_HEIGHT)].solid ||
			tileMap[parseInt(this.x / TILE_WIDTH)][parseInt((y + this.height) / TILE_HEIGHT)].solid ||
			tileMap[parseInt((this.x + this.width) / TILE_WIDTH)][parseInt(y / TILE_HEIGHT)].solid ||
			tileMap[parseInt((this.x + this.width) / TILE_WIDTH)][parseInt((y + this.height) / TILE_HEIGHT)].solid
			) {
			this.dy = 0.0;
		} else {
			this.y += this.dy;
		}
		
		if (Date.now() - this.lastFrameCheck > this.FRAME_TIME) {
			++this.currentFrame;
			if (this.currentFrame >= this.playerRightSprites.length) {
				this.currentFrame = 1;
			}
			this.lastFrameCheck = Date.now();
		}
	}
	
	this.render = function() {
		if (this.direction) {
			if (this.dx != 0 || this.dy != 0) {
				projectiles_buffer_context.drawImage(this.playerLeftSprites[this.currentFrame],this.x + pan_x - this.width*0.75,this.y + pan_y - this.height*2,this.width * 2.5,this.height * 3);
			} else {
				projectiles_buffer_context.drawImage(this.playerLeftSprites[0],this.x + pan_x - this.width*0.75,this.y + pan_y - this.height*2,this.width * 2.5,this.height * 3);
			}
		} else {
			if (this.dx != 0 || this.dy != 0) {
				projectiles_buffer_context.drawImage(this.playerRightSprites[this.currentFrame],this.x + pan_x - this.width*0.75,this.y + pan_y - this.height*2,this.width * 2.5,this.height * 3);
			} else {
				projectiles_buffer_context.drawImage(this.playerRightSprites[0],this.x + pan_x - this.width*0.75,this.y + pan_y - this.height*2,this.width * 2.5,this.height * 3);
			}
		}
	}
}

Overworld_Player.prototype.MOVEMENT_SPEED = 4.0;
Overworld_Player.prototype.FRAME_TIME = 250;

function overworld_tick() {
	pan_x = -overworld_player.x + (IMAGE_WIDTH / 2.0); 
	if (pan_x > 0.0) pan_x = 0.0;
	if (pan_x - IMAGE_WIDTH < -TILEMAP_WIDTH * TILE_WIDTH) pan_x = -(TILEMAP_WIDTH * TILE_WIDTH) + IMAGE_WIDTH;
	pan_y = -overworld_player.y + (IMAGE_HEIGHT / 2.0); 
	if (pan_y > 0.0) pan_y = 0.0;
	overworld_player.tick();
	if (!futuraTrigger) {
		if (futuraAlive && overworld_player.y < futuraY + TILE_HEIGHT*4) {
			futuraTrigger = true;
			overworld_dialogueManager.showScript(overworld_dialogueManager.futuraDialogue,STATE_FUTURA_LOOP);
		}
	}
	if (!decimTrigger) {
		if (decimAlive && overworld_player.y < decimY + TILE_HEIGHT*4) {
			decimTrigger = true;
			overworld_dialogueManager.showScript(overworld_dialogueManager.decimDialogue,STATE_DECIM_LOOP);
		}
	}
	
	overworld_dialogueManager.tick();
}

function overworld_render() {
	// Projectile Layer (Top Layer)
	projectiles_canvas_context.clearRect(0,0,projectiles_canvas.width,projectiles_canvas.height);
	projectiles_buffer_context.clearRect(0,0,projectiles_buffer.width,projectiles_buffer.height);
	//
	var xStart = parseInt(-pan_x / TILE_WIDTH);
	var xEnd = parseInt((-pan_x + IMAGE_WIDTH) / TILE_WIDTH) + 2;
	var yStart = parseInt(-pan_y / TILE_HEIGHT);
	var yEnd = parseInt((-pan_y + IMAGE_HEIGHT) / TILE_HEIGHT) + 2;
	if (xStart < 0) xStart = 0;
	if (xEnd > TILEMAP_WIDTH) xEnd = TILEMAP_WIDTH;
	if (yStart < 0) yStart = 0;
	if (yEnd > TILEMAP_HEIGHT) yEnd = TILEMAP_HEIGHT;
	for (var x = xStart ; x < xEnd ; ++x) {
		for (var y = yStart ; y < yEnd ; ++y) {
			tileMap[x][y].render(x,y);
		}
	}
	overworld_player.render();
	if (futuraAlive) projectiles_buffer_context.drawImage(futuraImg,futuraX+pan_x,futuraY+pan_y,TILE_WIDTH,TILE_HEIGHT * 2);
	if (decimAlive) projectiles_buffer_context.drawImage(decimImg,decimX+pan_x - 20,decimY+pan_y,TILE_WIDTH * 1.5,TILE_HEIGHT * 2);
	
	overworld_dialogueManager.render();
	//
	projectiles_canvas_context.drawImage(projectiles_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Interface Layer
	interface_canvas_context.clearRect(0,0,interface_canvas.width,interface_canvas.height);
	interface_buffer_context.clearRect(0,0,interface_buffer.width,interface_buffer.height);
	//
	
	//
	interface_canvas_context.drawImage(interface_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	// Entity Layer
	entities_canvas_context.clearRect(0,0,entities_canvas.width,entities_canvas.height);
	entities_buffer_context.clearRect(0,0,entities_buffer.width,entities_buffer.height);
	//
	
	//
	entities_canvas_context.drawImage(entities_buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}

function overworld_onkeydown(e) {
	if (overworld_dialogueManager.currentState == overworld_dialogueManager.STATE_IDLE) {
		switch(e.keyCode) {
			case CODE_W: overworld_player.up = true; break;
			case CODE_UP: overworld_player.up = true; break;
		
			case CODE_A: overworld_player.left = true; break;
			case CODE_LEFT: overworld_player.left = true; break;
		
			case CODE_D: overworld_player.right = true; break;
			case CODE_RIGHT: overworld_player.right = true; break;
		
			case CODE_S: overworld_player.down = true; break;
			case CODE_DOWN: overworld_player.down = true; break;
		
			case CODE_ENTER: break;
		}
	} else {
		overworld_player.up = false;
		overworld_player.down = false;
		overworld_player.left = false;
		overworld_player.right = false;
		overworld_player.dx = 0.0;
		overworld_player.dy = 0.0;
		overworld_dialogueManager.nextLine();
	}
}

function overworld_onkeyup(e) {
		switch(e.keyCode) {
			case CODE_W: overworld_player.up = false; break;
			case CODE_UP: overworld_player.up = false; break;
		
			case CODE_A: overworld_player.left = false; break;
			case CODE_LEFT: overworld_player.left = false; break;
		
			case CODE_D: overworld_player.right = false; break;
			case CODE_RIGHT: overworld_player.right = false; break;
		
			case CODE_S: overworld_player.down = false; break;
			case CODE_DOWN: overworld_player.down = false; break;
		
			case CODE_ENTER: break;
		}
}