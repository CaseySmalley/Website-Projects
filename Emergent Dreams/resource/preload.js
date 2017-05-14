let emergentGame = new Phaser.Game(
	640,
	480,
	Phaser.AUTO,
	"gameArea",
	null, // Initial State
	false, // Non Transparent Canvas
	false // Disable Anti Aliasing
);

emergentGame.music = {
	volume: 1.0
};

emergentGame.bindings = {
	jump: "w",
	slide: "s"
};

(function() {
	
	"use strict";
	
	// Used to retreive assets for the loading screen
	emergentGame.bootupState = {
		preload() { // Loading Screen Assets
			this.load.image("MenuBackground","resource/textures/MenuBackground.png");
			this.load.image("LoadingBarBorder","resource/textures/LoadingBarBorder.png");
			this.load.image("LoadingBar","resource/textures/LoadingBar.png");
			this.load.spritesheet("TitleOcean","resource/textures/OceanSpriteSheet.png",200,40);
		},
		
		create() { // Switch state when the minimal needed assets have been retreived
			emergentGame.state.start("preload");
		}
	}
	
	// Display a loading bar and retreive main game assets
	emergentGame.preloadState = {
		
		preload() { // Make loading requests and setup loading screen
			this.add.sprite(0,0,"MenuBackground");
			this.loadingBar = this.add.sprite(this.world.centerX - 158,this.world.centerY - 35,"LoadingBar");
			this.add.sprite(this.world.centerX - 164,this.world.centerY - 36,"LoadingBarBorder");
		
			this.ocean = this.add.sprite(this.world.centerX,this.world.centerY + 180,"TitleOcean");
			this.ocean.anchor.set(0.5,0.5);
			this.ocean.scale.set(3.2,3.0);
			
			this.ocean.animations.add("waves",[0,1],1,true);
			this.ocean.animations.play("waves");
		
			this.progress = 0;
			this.assetsToLoad = 0;
		
			// Load Main Assets
			
			// Main Menu
			
			// Audio
			this.load.audio("MainMenuTheme","resource/audio/MainMenu.mp3"); ++this.assetsToLoad;
			this.load.audio("LevelTheme","resource/audio/Level.mp3"); ++this.assetsToLoad;
			this.load.audio("Coin","resource/audio/Coin.mp3"); ++this.assetsToLoad;
			
			// Textures
			this.load.image("Logo","resource/icon.png"); ++this.assetsToLoad;
			this.load.image("MenuBlock","resource/textures/TitleBlock.png"); ++this.assetsToLoad;
			this.load.image("Instructions","resource/textures/Instructions.png"); ++this.assetsToLoad;
			this.load.spritesheet("MenuButtons","resource/textures/MenuButtonSpriteSheet.png",192,64); ++this.assetsToLoad;
			this.load.spritesheet("MainCharacter","resource/textures/MainCharacterSpriteSheet.png",32,32); ++this.assetsToLoad;
			this.load.spritesheet("Coin","resource/textures/CoinSpriteSheet.png",32,32); ++this.assetsToLoad;

			this.load.image("levelSheet","resource/textures/TileSheet.png"); ++this.assetsToLoad;
			
			// Levels
			this.load.tilemap("level 1","resource/levels/level 1.json",null,Phaser.Tilemap.TILED_JSON); ++this.assetsToLoad;
			this.load.tilemap("level 2","resource/levels/level 2.json",null,Phaser.Tilemap.TILED_JSON); ++this.assetsToLoad;
			this.load.tilemap("level 3","resource/levels/level 3.json",null,Phaser.Tilemap.TILED_JSON); ++this.assetsToLoad;
		},
		
		loadUpdate() { // Update loading graphics and change state when complete
			++this.progress;
			this.loadingBar.scale.setTo((this.progress / this.assetsToLoad) * 315.0,1.0);
			if (this.load.hasLoaded) {
				// Assign Music
				emergentGame.music.MainMenuTheme = this.add.audio("MainMenuTheme");
				emergentGame.music.LevelTheme = this.add.audio("LevelTheme");
				emergentGame.music.CoinFX = this.add.audio("Coin");
				emergentGame.music.MainMenuTheme.loop = true;
				emergentGame.music.LevelTheme.loop = true;
				emergentGame.music.CoinFX.allowMultiple = true;
				emergentGame.music.CoinFX.volume = emergentGame.music.volume * 0.25;
				
				emergentGame.state.start("mainMenu");
			}
		}
	}
	
}());