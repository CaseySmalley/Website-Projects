(function() {
	
	"use strict";
	
	emergentGame.inGameState = {
		
		score: 0, // Score holds the points for the current run of the level
		startScore: 0, // this holds the score you have at the start of a level (if the level restarts, score is set to this value)
		currentLevel: 1,
		isJumping: false, // Toggled depending on keystrokes (onkeydown/up)
		isSliding: false,
		
		// collision handle for overlaps between the coin group and the player sprite
		coinCallback(player,coin) {
			emergentGame.music.CoinFX.play();
			emergentGame.inGameState.score += 10.0;
			emergentGame.inGameState.scoreText.setText("Score: " + emergentGame.inGameState.score);
			coin.kill();
		},
		
		// handler for overlaps between the spikes and player sprite
		spikeCallback(player) {
			player.kill();
			this.score = this.startScore;
			emergentGame.music.LevelTheme.stop();
			emergentGame.state.start("gameOver");
		},
		
		endCallback() { // handler for when the end of the level is reached
			if (++this.currentLevel <= 3) {
				this.startScore = this.score;
				emergentGame.state.start("inGame");
			} else {
				emergentGame.music.LevelTheme.stop();
				emergentGame.state.start("gameVictory");
			}
		},
		
		create() {
			
			this.score = this.startScore;
			
			// Input event handling
			this.input.keyboard.onDownCallback = () => {
				if (this.input.keyboard.event.key === emergentGame.bindings.jump) this.isJumping = true; 
				if (this.input.keyboard.event.key === emergentGame.bindings.slide) this.isSliding = true;
			}
			
			this.input.keyboard.onUpCallback = () => {
				if (this.input.keyboard.event.key === emergentGame.bindings.jump) this.isJumping = false;
				if (this.input.keyboard.event.key === emergentGame.bindings.slide) this.isSliding = false;
			}
			
			// Background setup
			let background = this.add.sprite(0,0,"MenuBackground");
			background.fixedToCamera = true;
			
			this.ocean = this.add.tileSprite(320,240 + 75,200,40,"TitleOcean",0);
			this.ocean.fixedToCamera = true;
			this.ocean.anchor.set(0.5,0.5);
			this.ocean.scale.set(3.2,3.0);
			
			this.player = this.add.sprite(0,280,"MainCharacter");
			this.player.anchor.set(0.5,0.5);
			this.player.scale.set(3,3);
			
			this.player.animations.add("stand",[0,1],0.25,true);
			this.player.animations.add("run",[2,3,4,5],7,true);
			this.player.animations.add("jump",[6],1,true);
			this.player.animations.add("slide",[7],1,true);
			this.player.animations.play("stand");
			
			this.map = this.add.tilemap("level " + this.currentLevel);
			this.map.addTilesetImage("Runner","levelSheet");
			this.mapLayer = this.map.createLayer("Tile Layer 1");
			
			this.map.setTileIndexCallback([2,3],this.spikeCallback,this);
			
			this.world.setBounds(0,0,99999,99999);
			//this.camera.follow(this.player);
			
			this.physics.startSystem(Phaser.Physics.ARCADE);
			this.physics.enable(this.player,Phaser.Physics.ARCADE);
			this.physics.arcade.gravity.y = 800;
			
			// set collidable tiles
			this.map.setCollision([1,2]);
			
			// Retreive a list of entities in the object layer
			let objects = this.map.objects["Object Layer 1"];
			this.coins = this.add.group();
			this.coins.enableBody = true;
			
			// Sort entities into the correct groups
			for(let i = 0; i < objects.length; ++i) {
				switch(objects[i].name) {
					case "Coin":
						let coin = this.add.sprite(objects[i].x,objects[i].y + 170,"Coin");
						coin.animations.add("spin",[1,2,3,4,4,3,2,1],15,true);
						coin.animations.play("spin");
						this.coins.add(coin);
					break;
					
					case "End":
						this.endTrigger = this.add.sprite(objects[i].x,objects[i].y + 170,"Coin");
						this.physics.enable(this.endTrigger,Phaser.Physics.ARCADE);
						this.endTrigger.body.immovable = true;
						this.endTrigger.body.moves = false;
						this.endTrigger.scale.set(2.5);
					break;
				}
			}
			
			// Enable physics on the coins (for collision detection) but prevent them from moving
			for (let i = 0; i < this.coins.children.length; ++i) {
				this.coins.children[i].body.immovable = true;
				this.coins.children[i].body.moves = false;
			}
			
			this.scoreText = this.add.text(0,0,"Score: " + this.score,{font:"25px Courier New"});
			this.scoreText.fixedToCamera = true;
			
			emergentGame.music.LevelTheme.volume = emergentGame.music.volume * 0.75;
			emergentGame.music.LevelTheme.play();
		},
		
		update() {
			this.physics.arcade.collide(this.player,this.mapLayer); // Player to map collision and resolution
			this.physics.arcade.overlap(this.player,this.coins,this.coinCallback,null,this); // Overlap detection
			this.physics.arcade.overlap(this.player,this.endTrigger,this.endCallback,null,this);
			
			this.player.body.velocity.x = 150;
			
			this.camera.x = this.player.x - 320;
			this.ocean.tilePosition.x -= 0.1; // creates a pseudo parralax effect in th elevel
			
			if (this.player.body.onFloor()) { // Player movement/animation logic
				this.player.animations.play("run");
				this.player.body.setSize(10,27,11,3);
				if (this.isJumping) {
					this.player.body.velocity.y = -350;
					this.player.animations.play("jump");
				} else if (this.isSliding) {
					this.player.animations.play("slide");
					this.player.body.setSize(25,10,0,20);
				}
			}
		}
	}
	
	emergentGame.gameVictoryState = {
		
		create() {
			// UI setup
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			setTimeout(this.delayedFinish,1500);
		},
		
		delayedFinish() {
			// Delay this function to allow time for the scene to be created
			let name = prompt("Please Enter Your Name");
			
			// Send player data to server via Ajax GET request (Post would be more preferrable)
			let req = new XMLHttpRequest();
			req.onload = function() {
				emergentGame.inGameState.score = 0;
				emergentGame.inGameState.startScore = 0;
				emergentGame.inGameState.currentLevel = 1;
				emergentGame.state.start("mainMenu");
			}
			
			// Data is sent in plaintext without character escaping (vurnrable to SQL injection)
			req.open("GET","http://vesta.uclan.ac.uk/~casmalley/resource/server/insertScore.php?name="+name+"&score="+emergentGame.inGameState.score,true);
			req.send(null);
		}
	}
	
}());