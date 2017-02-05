window.onload = function() {
	hasSetup = false;
	IMAGE_WIDTH = 1000;
	IMAGE_HEIGHT = 1000;
	CANVAS_WIDTH = window.innerWidth * 0.5;
	CANVAS_HEIGHT = window.innerHeight * 0.984;
	SCALE_X = CANVAS_WIDTH / IMAGE_WIDTH;
	SCALE_Y = CANVAS_HEIGHT / IMAGE_HEIGHT;
	CODE_W = 87;
	CODE_S = 83;
	CODE_A = 65;
	CODE_D = 68;
	CODE_LEFT = 37;
	CODE_RIGHT = 39;
	CODE_UP = 38;
	CODE_DOWN = 40;
	CODE_ENTER = 13;
	STATE_OVERWORLD_LOOP = 0;
	STATE_FUTURA_LOOP = 1;
	STATE_DECIM_LOOP = 2;
	STATE_OPENING_LOOP = 3;
	STATE_OPENING_LOOP_FADEIN = 4;
	STATE_FAILURE_LOOP = 5;
	STATE_FAILURE_LOOP_FADEIN = 7;
	STATE_ENDGAME_LOOP = 6;
	STATE_PANEL_OPENING = 3;
	STATE_PANEL_CLOSING = 4;
	STATE_PANEL_CLOSING_DELAY = 5;
	PANEL_SPEED = 15;
	PANEL_LIMIT = 480.0;
	PANEL_DELAY = 1000;
	lastCheck = 0;
	panel_x = 480.0;
	panelState = -1;
	futureLoop = -1;
	currentLoop = -1;
	fadeOutAlpha = 0.0;
	tempLoop = -1;
	menuBackgroundImg = document.getElementById("menuBackground");
	menuOverlayImg = document.getElementById("menuOverlay");
	menuShipImg = document.getElementById("menuShip");
	menuGameOverImg = document.getElementById("menuGameOver");
	resize();
	setUpEnviroment();
	firstInitOverworld();
	
	menuPan1 = 0.0;
	menuPan2 = CANVAS_WIDTH;
	menuShip = CANVAS_WIDTH * 0.7;
	
	switchLoop(STATE_OPENING_LOOP);
	
	requestAnimationFrame(mainLoop);
}

function setUpEnviroment() {
	//Setup Canvas Variables And Frame Buffers
	//Background
	background_canvas = document.getElementById("background_canvas");
	background_canvas.width = CANVAS_WIDTH;
	background_canvas.height = CANVAS_HEIGHT;
	background_canvas_context = background_canvas.getContext("2d");
	//Interface
	interface_canvas = document.getElementById("interface_canvas");
	interface_buffer = document.getElementById("interface_buffer");
	interface_canvas.width = CANVAS_WIDTH;
	interface_canvas.height = CANVAS_HEIGHT;
	interface_buffer.width = IMAGE_WIDTH;
	interface_buffer.height = IMAGE_HEIGHT;
	interface_canvas_context = interface_canvas.getContext("2d");
	interface_buffer_context = interface_buffer.getContext("2d");
	//Entities
	entities_canvas = document.getElementById("entities_canvas");
	entities_buffer = document.getElementById("entities_buffer");
	entities_canvas.width = CANVAS_WIDTH;
	entities_canvas.height = CANVAS_HEIGHT;
	entities_buffer.width = IMAGE_WIDTH;
	entities_buffer.height = IMAGE_HEIGHT;
	entities_canvas_context = entities_canvas.getContext("2d");
	entities_buffer_context = entities_buffer.getContext("2d");
	//Projectiles
	projectiles_canvas = document.getElementById("projectiles_canvas");
	projectiles_buffer = document.getElementById("projectiles_buffer");
	projectiles_canvas.width = CANVAS_WIDTH;
	projectiles_canvas.height = CANVAS_HEIGHT;
	projectiles_buffer.width = IMAGE_WIDTH;
	projectiles_buffer.height = IMAGE_HEIGHT;
	projectiles_canvas_context = projectiles_canvas.getContext("2d");
	projectiles_buffer_context = projectiles_buffer.getContext("2d");
	//Panels
	panel_canvas = document.getElementById("panel_canvas");
	panel_canvas_context = panel_canvas.getContext("2d");
	panel_canvas.width = CANVAS_WIDTH;
	panel_canvas.height = CANVAS_HEIGHT;
	hasSetup = true;
	panelImg = document.getElementById("panel");
	panelAudio = new Audio("resource/panel.wav");
	panelAudio.volume = 0.25;
}

function clearDisplay() {
	background_canvas.width = background_canvas.width;
	interface_canvas.width = interface_canvas.width;
	entities_canvas.width = entities_canvas.width;
	projectiles_canvas.width = projectiles_canvas.width;
}

function resize() {
	CANVAS_WIDTH = window.innerWidth * 0.5;
	CANVAS_HEIGHT = window.innerHeight * 0.984;
	SCALE_X = CANVAS_WIDTH / IMAGE_WIDTH;
	SCALE_Y = CANVAS_HEIGHT / IMAGE_HEIGHT;
	background_canvas.width = CANVAS_WIDTH;
	background_canvas.height = CANVAS_HEIGHT;
	interface_canvas.width = CANVAS_WIDTH;
	interface_canvas.height = CANVAS_HEIGHT;
	entities_canvas.width = CANVAS_WIDTH;
	entities_canvas.height = CANVAS_HEIGHT;
	projectiles_canvas.width = CANVAS_WIDTH;
	projectiles_canvas.height = CANVAS_HEIGHT;
	panel_canvas.width = CANVAS_WIDTH;
	panel_canvas.height = CANVAS_HEIGHT;
	switch(currentLoop) {
		case STATE_OVERWORLD_LOOP: overworld_resize(); break;
		case STATE_FUTURA_LOOP: futura_resize(); break;
		case STATE_DECIM_LOOP: decim_resize(); break;
	}
}

function switchLoop(change) {
	switch(currentLoop) {
		case STATE_OVERWORLD_LOOP:
			closeOverworld();
		break;
		case STATE_FUTURA_LOOP:
			closeFutura();
		break;
		case STATE_DECIM_LOOP:
			closeDecim();
		break;
	}
	clearDisplay();
	currentLoop = change;
	switch(change) {
		case STATE_OVERWORLD_LOOP:
			initOverworld();
		break;
		case STATE_FUTURA_LOOP:
			initFutura();
		break;
		case STATE_DECIM_LOOP:
			initDecim();
		break;
	}
}

function panelLoop(change) {
	if (panelState == -1) {
		futureLoop = change;
		panelState = STATE_PANEL_CLOSING;
		panel_x = PANEL_LIMIT;
	}
}

window.onkeydown = function(e) {
	switch(currentLoop) {
		case STATE_OVERWORLD_LOOP: overworld_onkeydown(e); break;
		case STATE_FUTURA_LOOP: futura_onkeydown(e); break;
		case STATE_DECIM_LOOP: decim_onkeydown(e); break;
		case STATE_OPENING_LOOP: currentLoop = STATE_OPENING_LOOP_FADEIN; break;
		case STATE_FAILURE_LOOP: currentLoop = STATE_FAILURE_LOOP_FADEIN; firstInitOverworld(); break;
	}
}

window.onkeyup = function(e) {
	switch(currentLoop) {
		case STATE_OVERWORLD_LOOP: overworld_onkeyup(e); break;
		case STATE_FUTURA_LOOP: futura_onkeyup(e); break;
		case STATE_DECIM_LOOP: decim_onkeyup(e); break;
	}
}

function openingLoop_render() {
	menuPan1-= 0.5;
	menuPan2 -= 0.5;
	menuShip -= 0.2;
	if (menuShip < -0.1*CANVAS_WIDTH) {menuShip = 1.1*CANVAS_WIDTH;}
	if (menuPan1 < -CANVAS_WIDTH*2) {menuPan1 = CANVAS_WIDTH;}
	if (menuPan2 < -CANVAS_WIDTH*2) {menuPan2 = CANVAS_WIDTH;}
	projectiles_canvas_context.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	projectiles_canvas_context.drawImage(menuBackgroundImg,menuPan1,0,CANVAS_WIDTH*2,CANVAS_HEIGHT);
	projectiles_canvas_context.drawImage(menuBackgroundImg,menuPan2,0,CANVAS_WIDTH*2,CANVAS_HEIGHT);
	projectiles_canvas_context.drawImage(menuShipImg,menuShip,CANVAS_HEIGHT*0.45,CANVAS_WIDTH*0.1,CANVAS_HEIGHT*0.1);
	projectiles_canvas_context.drawImage(menuOverlayImg,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	
	if (currentLoop == STATE_OPENING_LOOP_FADEIN) {
		fadeOutAlpha += 0.01;
		projectiles_canvas_context.fillStyle = "rgba(0,0,0,"+fadeOutAlpha+")";
		projectiles_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
		if (fadeOutAlpha > 1.0) {
			fadeOutAlpha = 1.0;
			switchLoop(STATE_OVERWORLD_LOOP);
		}
	}
}

function failureLoop_render() {
	projectiles_canvas_context.clearRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	projectiles_canvas_context.drawImage(menuGameOver,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
	
	if (currentLoop == STATE_FAILURE_LOOP_FADEIN) {
		fadeOutAlpha += 0.01;
		projectiles_canvas_context.fillStyle = "rgba(0,0,0,"+fadeOutAlpha+")";
		projectiles_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
		if (fadeOutAlpha > 1.0) {
			fadeOutAlpha = 1.0;
			switchLoop(STATE_OVERWORLD_LOOP);
		}
	}
}

function mainLoop() {
	if (panelState != -1) {
		switch (panelState) {
			case STATE_PANEL_CLOSING: 
				panel_x -= PANEL_SPEED; 
				if (panel_x < 0.0) {
					panel_x = 0.0;
					lastCheck = Date.now();
					panelState = STATE_PANEL_CLOSING_DELAY;
					panelAudio.play();
				}
			break;
			
			case STATE_PANEL_CLOSING_DELAY:
				if (Date.now() - lastCheck > PANEL_DELAY) {
					panelState = STATE_PANEL_OPENING;
					switchLoop(futureLoop);
				}
			break;
			
			
			case STATE_PANEL_OPENING: 
				panel_x += PANEL_SPEED; 
				if (panel_x > PANEL_LIMIT) {
					panel_x = PANEL_LIMIT;
					panelState = -1;
				}
			break;
		}
		
		panel_canvas.width = panel_canvas.width;
		panel_canvas_context.drawImage(panel,-panel_x,0,CANVAS_WIDTH / 2,CANVAS_HEIGHT);
		panel_canvas_context.drawImage(panel,(CANVAS_WIDTH / 2) + panel_x,0,CANVAS_WIDTH / 2,CANVAS_HEIGHT);
	}
	switch(currentLoop) {
		case STATE_OVERWORLD_LOOP: overworld_tick(); overworld_render(); break;
		case STATE_FUTURA_LOOP: futura_tick(); futura_render(); break;
		case STATE_DECIM_LOOP: decim_tick(); decim_render(); break;
		case STATE_FAILURE_LOOP: failureLoop_render(); break;
	}
	
	switch(currentLoop) {
		case STATE_OPENING_LOOP: openingLoop_render(); break;
		case STATE_OPENING_LOOP_FADEIN: openingLoop_render(); break;
		case STATE_FAILURE_LOOP_FADEIN: failureLoop_render(); break;
		
		default:
			if(overworld_player.health == 0.0 && currentLoop != 5 && currentLoop != 7) {
				fadeOutAlpha += 0.01;
				projectiles_canvas_context.fillStyle = "rgba(0,0,0,"+fadeOutAlpha+")";
				projectiles_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
				if (fadeOutAlpha > 1.0) {
					fadeOutAlpha = 1.0;
					tempLoop = currentLoop;
					switchLoop(STATE_FAILURE_LOOP);
				}
			} else if (fadeOutAlpha > 0.0) {
				fadeOutAlpha -= 0.01;
				projectiles_canvas_context.fillStyle = "rgba(0,0,0,"+fadeOutAlpha+")";
				projectiles_canvas_context.fillRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
				if (fadeOutAlpha < 0.0) fadeOutAlpha = 0.0;
			}
		break;
	}
	requestAnimationFrame(mainLoop);
}