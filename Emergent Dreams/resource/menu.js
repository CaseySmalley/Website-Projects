(function() {
	
	"use strict";
	
	emergentGame.mainMenuState = {
		
		// UI callback
		StartGameButtonEvent() {
			emergentGame.music.MainMenuTheme.stop();
			emergentGame.state.start("inGame");
		},
		
		OptionsButtonEvent() {
			emergentGame.state.start("optionsMenu");
		},
		
		HighScoreButtonEvent() {
			emergentGame.state.start("highScoreTable");
		},
		
		create() {
			// Create Background
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			let UI = this.add.group();
			
			let title = this.add.text(320 - 40,240 - 150,"Emergent\n Dreams",{font:"bold 70px Courier New"});
			title.anchor.set(0.5,0.5);
			UI.add(title);
			
			let logo = this.add.sprite(320 + 180,240 - 120,"Logo");
			logo.anchor.set(0.5,0.5);
			logo.scale.set(4.0,4.0);
			UI.add(logo);
			
			let block = this.add.sprite(320 - 250,240 + 185,"MenuBlock");
			block.anchor.set(0.5,0.5);
			block.scale.set(11.0,6.0);
			UI.add(block);
			
			let guy = this.add.sprite(320 - 250,240 + 80,"MainCharacter");
			guy.anchor.set(0.5,0.5);
			guy.scale.set(5.0,5.0);
			
			guy.animations.add("stand",[0,1],0.25,true);
			guy.animations.add("run",[2,3,4,5],7,true);
			guy.animations.add("jump",[6],1,true);
			guy.animations.add("slide",[7],1,true);
			guy.animations.play("stand");
			UI.add(guy);
			
			this.startButton = this.add.button(320,240 - 20,"MenuButtons",this.StartGameButtonEvent);
			this.startButton.frame = 0;
			this.startButton.anchor.set(0.5,0.5);
			UI.add(this.startButton);
			
			let startButtonText = this.add.text(320,240 - 18,"Start Game",{font:"25px Courier New"});
			startButtonText.anchor.set(0.5,0.5);
			UI.add(startButtonText);
			
			this.optionsButton = this.add.button(320,240 + 76,"MenuButtons",this.OptionsButtonEvent);
			this.optionsButton.frame = 0;
			this.optionsButton.anchor.set(0.5,0.5);
			UI.add(this.optionsButton);
		
			let optionsButtonText = this.add.text(320,240 + 78,"Options",{font:"25px Courier New"});
			optionsButtonText.anchor.set(0.5,0.5);
			UI.add(optionsButtonText);
			
			this.scoreButton = this.add.button(320,240 + 172,"MenuButtons",this.HighScoreButtonEvent);
			this.scoreButton.frame = 0;
			this.scoreButton.anchor.set(0.5,0.5);
			UI.add(this.scoreButton);
		
			let scoreButtonText = this.add.text(320,240 + 174,"High Scores",{font:"25px Courier New"});
			scoreButtonText.anchor.set(0.5,0.5);
			UI.add(scoreButtonText);
		
			if (!emergentGame.music.MainMenuTheme.isPlaying) {
				emergentGame.music.MainMenuTheme.volume = emergentGame.music.volume;
				emergentGame.music.MainMenuTheme.play();
				
				UI.alpha = 0.0;
				this.add.tween(UI).to({alpha: 1},500,"Linear",true);
			}
		},
		
		// Change highlighting on buttons, depending on the position of the mouse
		update() {
			this.startButton.input.pointerOver() ?
				this.startButton.frame = 1:
				this.startButton.frame = 0;
				
			this.optionsButton.input.pointerOver() ?
				this.optionsButton.frame = 1:
				this.optionsButton.frame = 0;
			
			this.scoreButton.input.pointerOver() ?
				this.scoreButton.frame = 1:
				this.scoreButton.frame = 0;
		}
	}
	
	emergentGame.optionsMenuState = {
		
		// UI button callbacks
		backButtonEvent() {
			emergentGame.state.start("mainMenu");
		},
		
		instructionButtonEvent() {
			emergentGame.state.start("instructions");
		},
		
		// Used to detect wether a key binding needs to be changed or not
		setBinding: 0,
		
		jumpBindingEvent() {
			if (emergentGame.optionsMenuState.setBinding === 0) {
				emergentGame.optionsMenuState.setBinding = 1;
			}
		},
		
		slideBindingEvent() {
			if (emergentGame.optionsMenuState.setBinding === 0) {
				emergentGame.optionsMenuState.setBinding = 2;
			}
		},
		
		create() {
			
			this.input.keyboard.onDownCallback = () => {
				switch(emergentGame.optionsMenuState.setBinding) { // When active, set the binding to be the next key that is pressed
					case 1:										   // (Can be extended to include more key bindings)
						emergentGame.bindings.jump = this.input.keyboard.event.key;
						emergentGame.optionsMenuState.setBinding = 0;
						emergentGame.optionsMenuState.jumpBindingText.setText("> " + emergentGame.bindings.jump + " <");
						emergentGame.optionsMenuState.jumpBinding.frame = 0;
					break;
					
					case 2:
						emergentGame.bindings.slide = this.input.keyboard.event.key;
						emergentGame.optionsMenuState.setBinding = 0;
						emergentGame.optionsMenuState.slideBindingText.setText("> " + emergentGame.bindings.slide + " <");
						emergentGame.optionsMenuState.slideBinding.frame = 0;
					break;
				}
			}
			
			// UI setup
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			let block = this.add.sprite(320 - 250,240 + 185,"MenuBlock");
			block.anchor.set(0.5,0.5);
			block.scale.set(11.0,6.0);
			
			let guy = this.add.sprite(320 - 250,240 + 80,"MainCharacter");
			guy.anchor.set(0.5,0.5);
			guy.scale.set(5.0,5.0);
			
			guy.animations.add("stand",[0,1],0.25,true);
			guy.animations.add("run",[2,3,4,5],7,true);
			guy.animations.add("jump",[6],1,true);
			guy.animations.add("slide",[7],1,true);
			guy.animations.play("stand");
			
			this.backButton = this.add.button(320 - 220,240 - 200,"MenuButtons",this.backButtonEvent);
			this.backButton.anchor.set(0.5,0.5);
			let backButtonText = this.add.text(320 - 220,240 - 196,"Back",{font:"25px Courier New"});
			backButtonText.anchor.set(0.5,0.5);
			
			this.instructionButton = this.add.button(320 - 220,240 - 110,"MenuButtons",this.instructionButtonEvent);
			this.instructionButton.anchor.set(0.5,0.5);
			let instructionButtonText = this.add.text(320 - 220,240 - 106,"How To Play",{font:"25px Courier New"});
			instructionButtonText.anchor.set(0.5,0.5);
			
			let jumpLabel = this.add.sprite(320,240,"MenuButtons");
			jumpLabel.anchor.set(0.5,0.5);
			let jumpLabelText = this.add.text(320,240 + 4,"Jump:",{font:"25px Courier New"});
			jumpLabelText.anchor.set(0.5,0.5);
			
			this.jumpBinding = this.add.button(320 + 210,240,"MenuButtons",this.jumpBindingEvent);
			this.jumpBinding.anchor.set(0.5,0.5);
			this.jumpBindingText = this.add.text(320 + 210,240 + 4,"> " + emergentGame.bindings.jump + " <",{font:"25px Courier New"});
			this.jumpBindingText.anchor.set(0.5,0.5);
			
			let slideLabel = this.add.sprite(320,240 + 80,"MenuButtons");
			slideLabel.anchor.set(0.5,0.5);
			let slideLabelText = this.add.text(320,240 + 84,"Slide:",{font:"25px Courier New"});
			slideLabelText.anchor.set(0.5,0.5);
			
			this.slideBinding = this.add.button(320 + 210,240 + 80,"MenuButtons",this.slideBindingEvent);
			this.slideBinding.anchor.set(0.5,0.5);
			this.slideBindingText = this.add.text(320 + 210,240 + 84,"> " + emergentGame.bindings.slide + " <",{font:"25px Courier New"});
			this.slideBindingText.anchor.set(0.5,0.5);
		},
		
		update() { // Update button highlighting
			this.backButton.input.pointerOver() ?
				this.backButton.frame = 1:
				this.backButton.frame = 0;
				
			this.instructionButton.input.pointerOver() ?
				this.instructionButton.frame = 1:
				this.instructionButton.frame = 0;
				
			if (this.setBinding === 0) {
				this.jumpBinding.input.pointerOver() ?
					this.jumpBinding.frame = 1:
					this.jumpBinding.frame = 0;
				
				this.slideBinding.input.pointerOver() ?
					this.slideBinding.frame = 1:
					this.slideBinding.frame = 0;
			}
		}
	}
	
	emergentGame.instructionState = {
		
		// Button callbacks
		backButtonEvent() {
			emergentGame.state.start("optionsMenu");
		},
		
		create() {
			// UI setup
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			let block = this.add.sprite(320 - 250,240 + 185,"MenuBlock");
			block.anchor.set(0.5,0.5);
			block.scale.set(11.0,6.0);
			
			let guy = this.add.sprite(320 - 250,240 + 80,"MainCharacter");
			guy.anchor.set(0.5,0.5);
			guy.scale.set(5.0,5.0);
			
			guy.animations.add("stand",[0,1],0.25,true);
			guy.animations.add("run",[2,3,4,5],7,true);
			guy.animations.add("jump",[6],1,true);
			guy.animations.add("slide",[7],1,true);
			guy.animations.play("stand");
			
			let instructions = this.add.sprite(320 + 100,240 - 50,"Instructions");
			instructions.anchor.set(0.5,0.5);
			
			this.backButton = this.add.button(320 - 220,240 - 200,"MenuButtons",this.backButtonEvent);
			this.backButton.anchor.set(0.5,0.5);
			let backButtonText = this.add.text(320 - 220,240 - 196,"Back",{font:"25px Courier New"});
			backButtonText.anchor.set(0.5,0.5);
		},
		
		update() { // update button highlighting
			this.backButton.input.pointerOver() ?
				this.backButton.frame = 1:
				this.backButton.frame = 0;
		},
	}
	
	emergentGame.highScoreTableState = {
		
		backButtonEvent() { // button callback
			emergentGame.state.start("mainMenu");
		},
		
		create() {
			// UI setup
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			let title = this.add.text(320 + 100,240 - 195,"High Scores",{font:"bold 50px Courier New"});
			title.anchor.set(0.5,0.5);
			
			let block = this.add.sprite(320 - 250,240 + 185,"MenuBlock");
			block.anchor.set(0.5,0.5);
			block.scale.set(11.0,6.0);
			
			let guy = this.add.sprite(320 - 250,240 + 80,"MainCharacter");
			guy.anchor.set(0.5,0.5);
			guy.scale.set(5.0,5.0);
			
			guy.animations.add("stand",[0,1],0.25,true);
			guy.animations.add("run",[2,3,4,5],7,true);
			guy.animations.add("jump",[6],1,true);
			guy.animations.add("slide",[7],1,true);
			guy.animations.play("stand");
			
			this.backButton = this.add.button(320 - 220,240 - 200,"MenuButtons",this.backButtonEvent);
			this.backButton.anchor.set(0.5,0.5);
			
			let backButtonText = this.add.text(320 - 220,240 - 196,"Back",{font:"25px Courier New"});
			backButtonText.anchor.set(0.5,0.5);
			
			this.panelText = [];
			this.panelText.length = 5;
			
			for (let i = 0; i < 5; ++i) {
				let panel = this.add.sprite(320 + 100,240 - 130 + i * 75,"MenuButtons");
				panel.anchor.set(0.5,0.5);
				panel.scale.set(1.75,1.0);
				
				let panelText = this.add.text(320 + 100,240 - 130 + i * 75 + 4,"-",{font:"25px Courier New"});
				panelText.anchor.set(0.5,0.5);
				
				this.panelText[i] = panelText;
			}
			
			// A use of an Ajax Get using XMLHttpRequest to retreive the highscore data as a Json array
			let req = new XMLHttpRequest();
			
			req.onload = function() {
				let scores = JSON.parse(this.responseText);
				
				for (let i = 0; i < scores.length; ++i) {
					emergentGame.highScoreTableState.panelText[i].setText(scores[i].Name + ": " + scores[i].Score);
				}
			}
			
			// Constructed as (operation,url,async) -> Async meaning the script will continue to execute when
			// a reponse to the request can return at any time (hence the callback function)
			req.open("GET","http://vesta.uclan.ac.uk/~casmalley/resource/server/retreiveScores.php",true);
			req.send(null);
		},
		
		update() { // Update button highlighting
			this.backButton.input.pointerOver() ?
				this.backButton.frame = 1:
				this.backButton.frame = 0;
		}
	}
	
	emergentGame.gameOverState = {
		
		retryLevelEvent() {
			emergentGame.state.start("inGame");
		},
		
		mainMenuEvent() {
			emergentGame.inGameState.score = 0;
			emergentGame.inGameState.startScore = 0;
			emergentGame.inGameState.currentLevel = 1;
			emergentGame.state.start("mainMenu");
		},
		
		create() {
			this.add.sprite(0,0,"MenuBackground");
			let ocean = this.add.sprite(320,240 + 180,"TitleOcean");
			ocean.anchor.set(0.5,0.5);
			ocean.scale.set(3.2,3.0);
			
			ocean.animations.add("waves",[0,1],1,true);
			ocean.animations.play("waves");
			
			let UI = this.add.group();
			
			let title = this.add.text(320,80,"Game Over",{font:"bold 70px Courier New"});
			title.anchor.set(0.5,0.5);
			UI.add(title);
			
			this.retryButton = this.add.button(320,200,"MenuButtons",this.retryLevelEvent);
			this.retryButton.anchor.set(0.5,0.5);

			let retryButtonText = this.add.text(320,204,"Retry",{font:"25px Courier New"});
			retryButtonText.anchor.set(0.5,0.5);
			
			this.quitButton = this.add.button(320,300,"MenuButtons",this.mainMenuEvent);
			this.quitButton.anchor.set(0.5,0.5);
			
			let quitButtonText = this.add.text(320,304,"Quit",{font:"25px Courier New"});
			quitButtonText.anchor.set(0.5,0.5);
			
			UI.alpha = 0.0;
			this.add.tween(UI).to({alpha: 1},500,"Linear",true);
		},
		
		update() {
			this.retryButton.input.pointerOver() ?
				this.retryButton.frame = 1:
				this.retryButton.frame = 0;
				
			this.quitButton.input.pointerOver() ?
				this.quitButton.frame = 1:
				this.quitButton.frame = 0;
		}
	}
	
}());