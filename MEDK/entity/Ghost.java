package entity;

import textures.Sprites;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;

import level.Level;

public class Ghost extends Entity {

	private Image sprite;
	private int frame;
	private int delay; 
	private long lastFrame;
	private boolean direction = false;
	
	public Ghost(Human h,Image i,Level level) {
		super(level);
		this.sprite = i;
		this.width = h.getWidth();
		this.height = h.getHeight();
		this.delay = 700;
		this.direction = h.direction;
	}
	
	public boolean tick() {
			y--;
		if (y < -30) {
			return false;
		} else {
			return true;
		}
	}
	
	public void render(Graphics g) {
		if (!direction) {g.drawImage(sprite,(int) (level.getX() +x),(int) (level.getY() +y),null);}
		if (direction) {g.drawImage(sprite,0,(int) (level.getY() +y), width + (int) (level.getX() +x), height + (int) (level.getY() +y), width + (int) (level.getX() +x), 0, 0,height, null);}
	}
	
}
