var canvas = null;
var ctx = null;
var imageWidth = 600;
var imageHeight = 600;

var massSlider = null;
var renderCheckbox = null;
var sinCheckbox = null;
var waterSprings = [];
var leftDisplacements = [];
var rightDisplacements = [];
var sinDisplacements = [];
var sinAngle = 0;
var sinHeight = 10;
var sinInc = 0.1;
var sinInLoopInc = 0.8;
var waterSpringCount = 40;
var waterSpringSpread = 0.5;

var click = false;
var renderAsWater = false;

window.onload = function() {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext("2d");
	canvas.width = imageWidth;
	canvas.height = imageHeight;
	renderCheckbox = document.getElementById("renderCheckbox");
	sinCheckbox = document.getElementById("sinCheckbox");
	massSlider = document.getElementById("massSlider");
	
	renderCheckbox.checked = true;
	
	canvas.onmousedown = function(e) {
		var bounds = canvas.getBoundingClientRect();
		for (var i = 0; i < waterSpringCount; ++i) {
			if (Math.abs(waterSprings[i]._x - (e.clientX - bounds.left)) < 30)
				waterSprings[i].y = (e.clientY - bounds.top) - imageHeight/2;
		}
	}

	canvas.onmouseup = function(e) {
		click = false;
	}
	
	var displacement = imageWidth / (waterSpringCount-1);
	var randomTicks = 0;
	for (var i = 0; i < waterSpringCount; ++i) {
		waterSprings.push(new PointSpring(displacement * i,imageHeight/2,i));
		leftDisplacements[i] = 0;
		rightDisplacements[i] = 0;
		sinDisplacements[i] = 0;
	}
	
	requestAnimationFrame(loop);
}

var PointSpring = function(x,y,index) {
	this._x = x;
	this._y = y;
	this.y = 0;
	this.dy = 0;
	this.force = 0;
	this.mass = 10;
	this.springConstant = 0.025;
	this.index = index;
	
	this.tick = function() {
		var selfForce = -this.springConstant * this.y;
		var leftForce = 0; (this.index > 0) ? leftForce = -this.springConstant * leftDisplacements[this.index] : 0 ;
		var rightForce = 0; (this.index < waterSpringCount - 1) ? rightForce = -this.springConstant *  rightDisplacements[this.index] : 0 ;
		var sinForce = -this.springConstant * (this.y - sinDisplacements[this.index]);
		this.force = selfForce + leftForce + rightForce;
		if (sinCheckbox.checked) this.force += sinForce;
		this.dy = (this.dy + (this.force)) * 0.975;
		this.y += this.dy;
	}
	
	this.render = function() {
		ctx.fillStyle = "black";
		ctx.strokeStyle = "black";
		ctx.beginPath();
		ctx.moveTo(this._x,this._y);
		ctx.lineTo(this._x,this._y+this.y);
		ctx.stroke();
		ctx.beginPath();
		ctx.arc(this._x,this._y+this.y,this.mass/4,0,2*Math.PI,false);
		ctx.fill();
	}
}

var loop = function() {
	// Tick
	renderAsWater = renderCheckbox.checked;
	for (var i = 1; i < waterSpringCount; ++i) {
		leftDisplacements[i] = waterSpringSpread * (waterSprings[i].y - waterSprings[i-1].y);
	}
	
	for (var i = 0; i < waterSpringCount-1; ++i) {
		rightDisplacements[i] = waterSpringSpread * (waterSprings[i].y - waterSprings[i+1].y);
	}
	
	var angle = sinAngle;
	for (var i = 0; i < waterSpringCount; ++i) {
		sinDisplacements[i] = Math.sin(angle) * sinHeight;
		angle += sinInLoopInc;
	}
	sinAngle += sinInc;
	if (sinAngle > 2*Math.PI) sinAngle = 0;
	
	for (var i = 0; i < waterSpringCount; ++i) {
		waterSprings[i].mass = (110 / massSlider.value) * 10;
		waterSprings[i].tick();
	}
	// Render
	if (renderAsWater) {
		ctx.fillStyle = "cyan";
		ctx.fillRect(0,0,imageWidth,imageHeight);
		ctx.fillStyle = "blue";
		ctx.strokeStyle = "darkblue";
		ctx.lineWidth = 5;
		ctx.beginPath();
		ctx.moveTo(0,imageHeight/2);
		for (var i = 1; i < waterSpringCount - 1; i += 2) {
			ctx.lineTo(waterSprings[i]._x,waterSprings[i]._y+waterSprings[i].y);
		}
		ctx.lineTo(imageWidth,imageHeight/2);
		ctx.lineTo(imageWidth,imageHeight);
		ctx.lineTo(0,imageHeight);
		ctx.fill();
		ctx.stroke();
	} else {
		ctx.fillStyle = "white";
		ctx.fillRect(0,0,imageWidth,imageHeight);
		for (var i = 0; i < waterSpringCount; ++i) {
			waterSprings[i].render();
		}
	}
	//
	requestAnimationFrame(loop);
}