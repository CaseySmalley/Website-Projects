(function() {
	
	"use strict";
	
	window.onload = () => {
		emergentGame.state.add("bootup",emergentGame.bootupState);
		emergentGame.state.add("preload",emergentGame.preloadState);
		emergentGame.state.add("mainMenu",emergentGame.mainMenuState);
		emergentGame.state.add("optionsMenu",emergentGame.optionsMenuState);
		emergentGame.state.add("instructions",emergentGame.instructionState);
		emergentGame.state.add("highScoreTable",emergentGame.highScoreTableState);
		emergentGame.state.add("gameOver",emergentGame.gameOverState);
		emergentGame.state.add("inGame",emergentGame.inGameState);
		emergentGame.state.add("gameVictory",emergentGame.gameVictoryState);
		emergentGame.state.start("bootup");
	}
	
}());