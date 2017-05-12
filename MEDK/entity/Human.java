package entity;

import java.awt.Color;
import java.awt.Graphics;

import entity.particle.Particle;
import entity.particle.ParticleEmitter;

import textures.Sprites;
import level.Level;

public class Human extends Entity {

	protected Sprites spriteSheet;
	protected static final int STATE_RUNNING = 0;
	protected static final int STATE_IDLE = 1;
	protected static final int STATE_JUMPING = 2;
	protected static final int STATE_DYING = 3;
	protected static final int STATE_DEAD = 4;
	protected int state;
	protected int frame;
	protected int maxFrames;
	protected int frameDelay;
	protected long lastFrame;
	protected boolean direction;
	
	public Human() {
		this.level = input.Event.getCurrentLevel();
		this.killWait = 2000;
		this.width = 19;
		this.height = 29;
		this.spriteSheet = new Sprites("resource/humanSprites.png",height,width);
		this.moveSpeed = 0.4;
		this.maxMoveSpeed = 4;
		this.stopSpeed = 0.7;
		this.jumpStart = -13;
		this.alive = true;
		this.life = 2;
		this.killWait = 1000;
	}

	public void update() {
		checkState();
	}
	
	public void checkState() {
		switch (state) {
		case STATE_RUNNING:
			maxFrames = 1;
			frameDelay = 100;
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
			lastFrame = System.currentTimeMillis();
			frame++;
		}
		if (frame >= maxFrames + 1) { frame = 0;}
		
		if (dx < 0) {
			direction = true;
		} else if (dx > 0) {
			direction = false;
		}
	}
	
	public void life() {
		if (dying) {
			if (!firstDeath) {
				firstDeath = true;
				controlsEnabled = false;
				left = false;
				right = false;
				this.killLastCount = System.currentTimeMillis();
				this.emitter = new ParticleEmitter(0,0,20,new Color(250,200,0),ParticleEmitter.FIRE,100);
				this.emitter.setParent(this);
			}
			if (System.currentTimeMillis() - killLastCount > killWait) {
				killLastCount = System.currentTimeMillis();
				life--;
				if (life <= 0) {
					Ghost g = new Ghost(this,spriteSheet.getFrame(4,0),level);
					g.setPos(x,y);
					level.addEntity(g);
					alive = false;
				}
			}
		}
	}
	
	public void render(Graphics g) {
		if (!direction) {g.drawImage(spriteSheet.getFrame(state,frame),(int) (level.getX() +x),(int) (level.getY() +y),null);}
		if (direction) {g.drawImage(spriteSheet.getFrame(state,frame),0,(int) (level.getY() +y), width + (int) (level.getX() +x), height + (int) (level.getY() +y), width + (int) (level.getX() +x), 0, 0,height, null);}
		if (emitter != null) {emitter.render(g);}
		g.setColor(Color.WHITE);
		g.drawString(name,(int) (level.getX() + (x -width/2 )),(int) (level.getY() + y - (height/2)) );
		draw(g);
	}
	
}