package entity;

import input.editor.tool.Ray;
import input.editor.tool.Vector;

import java.awt.Color;
import java.awt.Graphics;

import entity.particle.ParticleEmitter;
import textures.Sprites;
import level.Level;
import level.tile.TileList;

public class BaseEnemy extends Human {
	
	// static contstants that are used to determine what state of animation the enemy is in
	protected static final int STATE_IDLE = 0;
	protected static final int STATE_RUNNING = 1;
	protected static final int STATE_JUMPING = 2;
	protected static final int STATE_DYING = 3;
	protected static final int STATE_DEAD = 4;
	protected Entity target;
	
	public BaseEnemy() {
		this.level = input.Event.getCurrentLevel();
		this.maxMoveSpeed = 2.5;
		this.jumpStart = -12;
		this.height = 45;
		this.width = 35;
		this.spriteSheet = new Sprites("resource/enemySprites.png",height,width);
		this.type = EntityList.ENT_ENEMY;
		this.isHostile = true;
		this.state = STATE_JUMPING;
	}

	public void update() {
		// an overwritten method that is called by the normal tick function
		// updates its animation state (what animation is suppost to be used and what frame)
		checkState();
		if (target == null) {
			simpleAI();
		} else {
			targetAI();
		}
	}
	
	public void checkState() {
		switch (state) {
		case STATE_RUNNING:
			maxFrames = 3;
			// total frames of animation
			frameDelay = 50;
			// time inbetween frames
			break;
		
		case STATE_IDLE:
			frameDelay = 0;
			maxFrames = 0;
			break;
			
		case STATE_JUMPING:
			frameDelay = 0;
			maxFrames = 0;
			break;
			
		case STATE_DYING:
			frameDelay = 1000;
			maxFrames = 1;
			break;
			
		case STATE_DEAD:
			frameDelay = 2500;
			maxFrames = 1;
			break;
		}
		
		// what animation state the enemy should be in
		// based on what inputs are set to true
		if (!dying) {
			if ( (!left || !right) && !falling) {
				state = STATE_IDLE;
			}
			if (falling) {
				state = STATE_JUMPING;
			}
			
			if (!falling && (left || right)) {
				state = STATE_RUNNING;
			}
		} else {
			state = STATE_DYING;
		}
		
		if (System.currentTimeMillis() - lastFrame > frameDelay && state != STATE_JUMPING && state != STATE_IDLE) {
			// if it has been the set delay since the last frame and if the state isn't an animation
			// that only has one frame then reset the time and increment the frame
			lastFrame = System.currentTimeMillis();
			frame++;
		}
		if (frame >= maxFrames + 1) { frame = 0;}
		// if the end of the animatio is reached, then it is reset
		
		// what direction the frame is rendered in (left/right)
		if (dx < 0) {
			direction = true;
		} else if (dx > 0) {
			direction = false;
		}
	}
	
	public void function(int i) {
		// one of the AI constants is parsed into this method from a tile which contains it
		switch(i) {
		case TileList.AI_RIGHT:
			setLeft(false);
			setRight(true);
			break;
			
		case TileList.AI_LEFT:
			setLeft(true);
			setRight(false);
			break;
			
		case TileList.AI_JUMP:
			setJumping(true);
			break;
			
		case TileList.AI_STOP:
			setLeft(false);
			setRight(false);
			break;
		}
	}
	
	public void simpleAI() {
		
		// a simplistic AI which is used if the enemy has no target to chase after
		int x = (int) ( (this.x + (width / 2)) / level.getTileSize());
		int y = (int) ( (this.y + (height / 2)) / level.getTileSize());
		function(level.getTile(x,y).getFunction());
		// checking the AI function of the current tile it is in
				
		if ((left || right) && dx == 0) {
			// if the enemy is running left or right but hits a wall it will then attempt to jump over it
			setJumping(true);
		}
		
	}
	
	public void targetAI() {
		// if the enemy has a target then it will chaser after it
		if (target.getX() < this.x - 50) {
			function(TileList.AI_LEFT);
		} else if (target.getX() > this.x + 50) {
			function(TileList.AI_RIGHT);
			// running left / right based on x co-ordinates
		} else {
			// if close enough it will attempt to jump on its target
			setJumping(true);
		}
		
		if ((left || right) && dx == 0) {
			// if the enemy is running left or right but hits a wall it will then attempt to jump over it
			setJumping(true);
		}
	}
	
	public void life() {
		// called by the normal tick method
		
		// checks if the kill() method has been called
		if (dying) {
			if (!firstDeath) {
				// only runs the first time life is checked after kill() has been called
				firstDeath = true;
				controlsEnabled = false;
				left = false;
				right = false;
				// disabling controls
				this.killLastCount = System.currentTimeMillis();
				this.emitter = new ParticleEmitter(0,0,20,new Color(0,125,255),ParticleEmitter.FIRE,100);
				this.emitter.setParent(this);
				// setting up fire emitter
			}
			if (System.currentTimeMillis() - killLastCount > killWait) {
				killLastCount = System.currentTimeMillis();
				life--;
				if (life <= 0) {
					// when the animation has finished and the entity is "dead" then a ghost
					// is created at its position and added to the level
					// before the enemy is deleted
					Ghost g = new Ghost(this,spriteSheet.getFrame(3,2),level);
					g.setPos(x,y);
					level.addEntity(g);
					alive = false;
				}
			}
		}
	}
	public void setTarget(Entity e) { this.target = e;}
	
}
