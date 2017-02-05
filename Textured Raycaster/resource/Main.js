window.onload = function() {
	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");
	var test_canvas = document.getElementById("test_canvas");
	var test_context = test_canvas.getContext("2d");
	var IMAGE_WIDTH = 400;
	var IMAGE_HEIGHT = 400;
	canvas.width = IMAGE_WIDTH;
	canvas.height = IMAGE_HEIGHT;
	test_canvas.width = IMAGE_WIDTH;
	test_canvas.height = IMAGE_HEIGHT;
 	test_context.imageSmoothingEnabled = false;

	var testTextureImg = document.getElementById("testTexture");
	var testGradientImg = document.getElementById("testGradient");
	
	var castX = 3.5;
	var castY = 3.5;
	var castAngle = 0.0;
	var castFov = 60 * (Math.PI / 180);
	
	var voxelMap = [];
	var MAP_WIDTH = 27;
	var MAP_HEIGHT = 27;
	var RENDER_SCALE = 15;
	var RENDER_DISTANCE = 25;
	var WALL_HEIGHT = 1.0;
	var PROJECTION_PLANE_DISTANCE = IMAGE_WIDTH/2 / Math.tan(castFov/2);
	var PROJECTION_CONST = WALL_HEIGHT * PROJECTION_PLANE_DISTANCE;
	var QUATER_ANGLE = 0.5*Math.PI;
	var HALF_ANGLE = Math.PI;
	var THREE_QUATER_ANGLE = 1.5*Math.PI;
	var MAX_ANGLE = 2*Math.PI;
	var MAX_HEIGHT = 4;
	
	var moveSpeed = 0.03;
	var turnSpeed = 0.03;
	
	var forward = false;
	var backward = false;
	var left = false;
	var right = false;
	
	for (var x = 0 ; x < MAP_WIDTH ; ++x) {
		voxelMap.push(new Uint8Array(MAP_HEIGHT));
		for (var y = 0 ; y < MAP_HEIGHT; ++y) {
			if (Math.random() > 0.9) voxelMap[x][y] = parseInt(Math.random() * 3) + 1; else voxelMap[x][y] = 0;
		}
	}
	
	for (var x = 0 ; x < MAP_WIDTH ; ++x) {
		voxelMap[x][0] = 4;
		voxelMap[x][MAP_HEIGHT-1] = 4;
	}
	
	for (var y = 0 ; y < MAP_HEIGHT ; ++y) {	
		voxelMap[0][y] = 4;
		voxelMap[MAP_WIDTH-1][y] = 4;
	}
	
window.onkeydown = function(e) {
	switch(e.keyCode) {
		case 38: forward = true; break;
		case 87: forward = true; break;
		
		case 37: left = true; break;
		case 65: left = true; break;
		
		case 39: right = true; break;
		case 68: right = true; break;
		
		case 83: backward = true; break;
		case 40: backward = true; break;
	}
}

window.onkeyup = function(e) {
	switch(e.keyCode) {
		case 38: forward = false; break;
		case 87: forward = false; break;
		
		case 37: left = false; break;
		case 65: left = false; break;
		
		case 39: right = false; break;
		case 68: right = false; break;
		
		case 83: backward = false; break;
		case 40: backward = false; break;
	}
}
	
	var castRay = function(x,y,angle,voxel) {
	
		var getVoxel = function(x,y) {
			if (x > -1 && x < MAP_WIDTH &&
				y > -1 && y < MAP_HEIGHT)
			return voxelMap[x][y];
		}
	
		if (angle < 0) angle += MAX_ANGLE;
		if (angle > MAX_ANGLE) angle -= MAX_ANGLE;
		var vx = x;
		var vy = y;
		var hx = x;
		var hy = y;
		var xa = 0.0;
		var ya = 0.0;
		var vd = 0.0;
		var hd = 0.0;
		var stepsTaken = 0;
		var up = (angle >= HALF_ANGLE && angle <= MAX_ANGLE);
		var right = (angle >= 0.0 && angle <= QUATER_ANGLE) || (angle >= THREE_QUATER_ANGLE && angle <= MAX_ANGLE);
		
		// Vertical Intersections
		if (right) {
			vy += Math.tan(angle) * ( parseInt(x + 1) - x );
			vx = parseInt(x + 1);
			ya = Math.tan(angle);
		} else {
			vy += -Math.tan(angle) * (x - parseInt(x));
			vx = parseInt(x) - 0.00001;
			ya = -Math.tan(angle);
		}
		
		while(stepsTaken < RENDER_DISTANCE) {
			if (getVoxel(parseInt(vx),parseInt(vy)) > voxel) break;
			if (right) ++vx; else --vx;
			vy += ya;
			++stepsTaken;
		}
		
		// Horizontal Intersections
		if (up) {
			hx += Math.tan(angle-QUATER_ANGLE) * ( y - parseInt(y) );
			hy = parseInt(y) - 0.00001;
			xa = -1/Math.tan(angle);
		} else {
			hx += -Math.tan(angle-QUATER_ANGLE) * ( parseInt(y + 1) - y );
			hy = parseInt(y+1);
			xa = 1/Math.tan(angle);
		}
		
		stepsTaken = 0;
		while(stepsTaken < RENDER_DISTANCE) {
			if (getVoxel(parseInt(hx),parseInt(hy)) > voxel) break;
			if (up) --hy; else ++hy;
			hx += xa;
			++stepsTaken;
		}
		
		var voxelHit = 0;
		var direction = false;
		var dist = 0.0;
		vd = (x-vx)*(x-vx)+(y-vy)*(y-vy);
		hd = (x-hx)*(x-hx)+(y-hy)*(y-hy);
		if ( vd < hd ) {
			x = vx;
			y = vy;
			voxelHit = getVoxel(parseInt(vx),parseInt(vy));
			dist = Math.sqrt(vd);
			direction = true;
		} else {
			x = hx;
			y = hy;
			dist = Math.sqrt(hd);
			voxelHit = getVoxel(parseInt(hx),parseInt(hy));
		}
		dist *= Math.cos(angle - castAngle);
		return [x,y,dist,voxelHit,direction];
	}
	
	var tick = function() {
		if (forward) {
			castX += Math.sin(castAngle + Math.PI*0.5) * moveSpeed;
			castY += -Math.cos(castAngle + Math.PI*0.5) * moveSpeed;
		}
		
		if (backward) {
			castX -= Math.sin(castAngle + Math.PI*0.5) * moveSpeed;
			castY -= -Math.cos(castAngle + Math.PI*0.5) * moveSpeed;
		}
		
		if (left) castAngle -= turnSpeed;
		if (right) castAngle += turnSpeed;
		
		if (castAngle > 2*Math.PI) castAngle = castAngle - 2*Math.PI;
		if (castAngle < 0.0) castAngle = 2*Math.PI - castAngle;
	}
	
	var renderWallSegment = function(ray,x) {
		if (ray[4]) {
			test_context.fillStyle = "rgba(0,0,0,0.3)";
			var textureX = Math.abs(ray[1] - parseInt(ray[1]))*100;
		} else {
			test_context.fillStyle = "rgba(0,0,0,0.5)";
			var textureX = parseInt(Math.abs(ray[0] - parseInt(ray[0]))*100);
		}
		var height = PROJECTION_CONST / ray[2];
	
		for (var j = 0 ; j < ray[3] ; ++j) {
			test_context.drawImage(testTextureImg,
				textureX,0,1,100,
				x,IMAGE_HEIGHT/2 - height/2 - height * j,1,height);
		}
		
		test_context.drawImage(testGradientImg,
			textureX,0,1,100,
			x,IMAGE_HEIGHT/2 - height/2 + height,1,height);
		
		test_context.fillRect(x,IMAGE_HEIGHT/2 - height/2 - height*(j-1),1,height*j);
		test_context.fillStyle = "rgba(0,0,0,0.75)";
		test_context.fillRect(x,IMAGE_HEIGHT/2 - height/2 + height,1,height);
	}
	
	var render = function() {
		context.fillStyle = "black";
		context.fillRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT);
		
		test_context.fillStyle = "black";
		test_context.fillRect(0,IMAGE_HEIGHT/2,IMAGE_WIDTH,IMAGE_HEIGHT/2);
		
		test_context.fillStyle = "darkcyan";
		test_context.fillRect(0,0,IMAGE_WIDTH,IMAGE_HEIGHT/2);
		
		context.fillStyle = "white";
		
		for (var x = 0 ; x < MAP_WIDTH ; ++x) {
			for (var y = 0 ; y < MAP_HEIGHT ; ++y) {
				if (voxelMap[x][y]) context.fillRect(x*RENDER_SCALE,y*RENDER_SCALE,RENDER_SCALE,RENDER_SCALE);
			}
		}
		
		context.strokeStyle = "red";
		
		var angleInc = castFov / IMAGE_WIDTH;
		var ray = null;
		var ray2 = null;
		var ray3 = null;
		var ray4 = null;
		var x = 0;
		var textureX = 0;
		var height = 0.0;
		context.beginPath();
		for (var i = castAngle - castFov/2 ; i <= castAngle + castFov/2 ; i += angleInc) {
			ray = castRay(castX,castY,i,0);
			context.moveTo(castX*RENDER_SCALE,castY*RENDER_SCALE);
			context.lineTo(ray[0]*RENDER_SCALE,ray[1]*RENDER_SCALE);
			if (ray[3] > 0) {
				
				ray2 = castRay(ray[0],ray[1],i,ray[3]);
				ray2[2] += ray[2];
				if (ray2[3] > 0) {
					ray3 = castRay(ray2[0],ray2[1],i,ray2[3]);
					ray3[2] += ray2[2];
					if (ray3[3] > 0) {
						ray4 = castRay(ray3[0],ray3[1],i,ray3[3]);
						ray4[2] += ray3[2];
						if (ray4[3] > 0) renderWallSegment(ray4,x);
						renderWallSegment(ray3,x);
					}
					renderWallSegment(ray2,x);
				}
				renderWallSegment(ray,x);
			}
			++x;
		}
		context.stroke();
	}
	
	var loop = function() {
		tick();
		render();
		requestAnimationFrame(loop);
	}
	requestAnimationFrame(loop);
}