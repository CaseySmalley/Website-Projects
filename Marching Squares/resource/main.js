window.onload = function() {
	IMAGE_WIDTH = 500;
	IMAGE_HEIGHT = 500;
	CANVAS_WIDTH = 640;
	CANVAS_HEIGHT = 480;
	SCALE_X = CANVAS_WIDTH / IMAGE_WIDTH;
	SCALE_Y = CANVAS_HEIGHT / IMAGE_HEIGHT;
	mouseX = 0;
	mouseY = 0;
	mouseClicked = false;
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;
	buffer.width = IMAGE_WIDTH;
	buffer.height = IMAGE_HEIGHT;
	canvas = document.getElementById("canvas");
	buffer = document.getElementById("buffer");
	mainC = canvas.getContext('2d');
	bufferC = buffer.getContext('2d');
	canvas.addEventListener('mousemove',mouseMoveEvent,false);
	canvas.addEventListener('mousedown',mouseDownEvent,false);
	canvas.addEventListener('mouseup',mouseUpEvent,false);
	//Rendering Values
	SQUARE_SCALE = 10;
	SQUARE_HALF = SQUARE_SCALE / 2;
	SQUARE_LIMIT = 0.2;
	
	// Entity values
	GRAVITY_ACCELERATION = 0;
	AIR_RESISTANCE = 0.015;
	
	BALL_COUNT = 20;
	BALL_SIZE = 15;
	//Entity Declaration
	balls = [];
	for (var i = 0 ; i < BALL_COUNT ; i++) {
		balls.push(new Ball(100 + parseInt(Math.random() * 150),parseInt(Math.random() * 400),BALL_SIZE));
	}
	
	div_width = parseInt(IMAGE_WIDTH / SQUARE_SCALE);
	div_height = parseInt(IMAGE_HEIGHT / SQUARE_SCALE);
	corners = [];
	for (var x = 0 ; x < div_width ; ++x) {
		corners.push([]);
		for (var y = 0 ; y < div_height ; ++y) {
			corners[x].push(0);
		}
	}
	
	requestAnimationFrame(loop);
}

function Ball(x,y,radius) {
	this.x = x;
	this.y = y;
	this.dx = Math.random() * 20;
	this.dy = 0;
	this.radius = radius;
	this.colour = getRandomColour();
	this.colided = false;
	
	this.tick = function() {
		this.x += this.dx;
		this.y += this.dy;
		//Vertical
		if (this.dy < 0) {
			this.dy += AIR_RESISTANCE;
			if (this.dy > 0) this.dy = 0;
		}
		else if (this.dy > 0) {
			this.dy -= AIR_RESISTANCE
			if (this.dy < 0) this.dy = 0;
		}
		
		if (this.y - this.radius < 0) {
			this.y = this.radius;
			this.dy = -this.dy * 0.8;
		}
		
		if (this.y + this.radius > IMAGE_WIDTH) {
			this.y = IMAGE_HEIGHT - this.radius;
			this.dy = -this.dy * 0.8;
		}
		this.dy += GRAVITY_ACCELERATION;
		//Horizontal
		if (this.dx < 0) {
			this.dx += AIR_RESISTANCE;
			if (this.dx > 0) this.dx = 0;
		}
		else if (this.dx > 0) {
			this.dx -= AIR_RESISTANCE
			if (this.dx < 0) this.dx = 0;
		}
		
		if (this.x - this.radius < 0) {
			this.x = this.radius;
			this.dx = -this.dx * 0.8;
		}
		
		if (this.x + this.radius > IMAGE_WIDTH) {
			this.x = IMAGE_WIDTH - this.radius;
			this.dx = -this.dx * 0.8;
		}
	}
	
	this.render = function() {
		bufferC.strokeStyle = '#808080';
		bufferC.beginPath();
		bufferC.arc(this.x,this.y,this.radius,0,2 * Math.PI,false);
		bufferC.fillStyle = this.colour;
		bufferC.lineWidth = 4;
		bufferC.stroke();
	}
}

function sphereCollision(x1,y1,x2,y2,radius) {
	var distance = Math.pow(x1 - x2,2) + Math.pow(y1 - y2,2);
	return distance < radius * radius;
}

function resolveCollision(ball1,ball2) {
	var x = ball1.x - ball2.x;
	var y = ball1.y - ball2.y;
	var distance = Math.sqrt(x*x + y*y);
	var scale = (distance / (ball1.radius + ball2.radius));
	if (scale > 1.1) scale = 0;
	x /= distance;
	y /= distance;
	if (!ball1.colided || !ball2.colided) {
		ball1.dx += x * scale * 0.5;
		ball1.dy += y * scale * 0.5;
		ball2.dx += -x * scale * 0.5;
		ball2.dy += -y * scale * 0.5;
		ball1.colided = true;
		ball2.colided = true;
	}
}

function loop() {
	tick();
	render();
	requestAnimationFrame(loop);
}

function getRandomColour() {
    var letters = '0123456789ABCDEF'.split('');
    var colour = '#';
    for (var i = 0; i < 6; ++i) {
        colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
}

function mouseMoveEvent(e) {
	
}

function mouseDownEvent(e) {
	var bounds = canvas.getBoundingClientRect();
	mouseX = e.clientX - bounds.left;
	mouseY = e.clientY - bounds.top;
	mouseClicked = true;
}

function mouseUpEvent(e) {
	mouseClicked = false;
}

function tick() {
	if (mouseClicked) {
		var force_x = 0;
		var force_y = 0;
		var force_distance = 0;
		for (var i = 0 ; i < BALL_COUNT ; ++i) {
			force_x = mouseX - balls[i].x;
			force_y = mouseY - balls[i].y;
			force_distance = Math.sqrt(force_x*force_x + force_y*force_y);
			balls[i].dx += (force_x / force_distance) / 5;
			balls[i].dy += (force_y / force_distance) / 5;
		}
	}

	for (var i = 0; i < BALL_COUNT; ++i) {
		balls[i].tick();
	}
	
	// Collision
	for (var i = 0 ; i < BALL_COUNT ; ++i) {
		balls[i].colided = false;
	}
	for (var i = 0 ; i < BALL_COUNT ; ++i) {
		for (var j = 0 ; j < BALL_COUNT ; ++j) {
				if (i != j) {
					if (sphereCollision(balls[i].x + balls[i].dx,balls[i].y + balls[i].dy,balls[j].x + balls[j].dx,balls[j].y + balls[j].dy,balls[i].radius + balls[j].radius)) {
						resolveCollision(balls[i],balls[j]);
						break;
					}
				}
			}
	}
}

function checkSquare(x,y) {
	var values = [];
	var temp = 0;
	for (var i = 0 ; i < BALL_COUNT ; ++i) {
		values.push(balls[i].radius * balls[i].radius/( (x - balls[i].x)*(x - balls[i].x) + (y - balls[i].y)*(y - balls[i].y) ));
	}
	
	for (var i = 0 ; i < BALL_COUNT ; ++i) {
		if (values[i] > temp) temp = values[i];
	}
	return temp;
}

function marchSquare(x,y,corners) {
	var type = 0;
	if (corners[x][y] > SQUARE_LIMIT) type += 8;
	if (corners[x+1][y] > SQUARE_LIMIT) type += 4;
	if (corners[x+1][y+1] > SQUARE_LIMIT) type += 2;
	if (corners[x][y+1] > SQUARE_LIMIT) type += 1;
	
	bufferC.fillStyle = 'white';
	bufferC.strokeStyle = 'white';
	bufferC.beginPath();
	x *= SQUARE_SCALE;
	y *= SQUARE_SCALE;
	switch(type) {
		case 1:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
		break;
		case 2:
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 3:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 4:
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 5:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.stroke();
			bufferC.beginPath();
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 6:
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
		break;
		case 7:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y);
		break;
		case 8:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y);
		break;
		case 9:
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
		break;
		case 10:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
			bufferC.stroke();
			bufferC.beginPath();
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 11:
			bufferC.lineTo(x + SQUARE_HALF,y);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 12:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 13:
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
			bufferC.lineTo(x + SQUARE_SCALE,y + SQUARE_HALF);
		break;
		case 14:
			bufferC.lineTo(x,y + SQUARE_HALF);
			bufferC.lineTo(x + SQUARE_HALF,y + SQUARE_SCALE);
		break;
	}
	bufferC.stroke();
}

function render() {
	buffer.width = buffer.width;
	bufferC.fillStyle = '#000000';
	bufferC.fillRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
	bufferC.lineWidth = 3;
	for (var x = 0 ; x < div_width ; ++x) {
		for (var y = 0 ; y < div_height ; ++y) {
			corners[x][y] = checkSquare(x * SQUARE_SCALE,y * SQUARE_SCALE);
		}
	}
	
	for (var x = 0 ; x < div_width - 1 ; ++x) {
		for (var y = 0 ; y < div_height - 1 ; ++y) {
			marchSquare(x,y,corners);
		}
	}
	/*
	for (var i = 0; i < BALL_COUNT; ++i) {
		balls[i].render();
	}
	*/
	mainC.drawImage(buffer,0,0,CANVAS_WIDTH,CANVAS_HEIGHT);
}