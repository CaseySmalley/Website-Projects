package entity;

import java.awt.Graphics;

import textures.Sprites;
import level.Level;

public class Light extends Entity{
	
	// the only purpose of this entity is to provide as a light source in the lighting shader
	// it can only move when parented to another entity and lights up the tile it is in to the maximum value
	
	public Light() {
		this.level = input.Event.getCurrentLevel();
		this.controlsEnabled = false;
		this.moveSpeed = 0.0;
		this.maxMoveSpeed = 0;
		this.jumpStart = 0;
		this.width = 0;
		this.height = 0;
		this.alive = true;
		this.damageDone = 0;
		this.killWait = 0;
		this.life = 1;
		this.stopSpeed = 0;
	}
	
	public void kill() {
		alive = false;
	}
	
	public boolean tick() {
		if (parent != null) {
			this.x = parent.getX() - offX;
			this.y = parent.getY() - offY;
		}
		return alive;
	}
	
	public void render(Graphics g) {
		level.getTile((int) (x / level.getTileSize()),(int) (y / level.getTileSize())).setBrightness(0f);
	}
	
	
	
	
	
}
