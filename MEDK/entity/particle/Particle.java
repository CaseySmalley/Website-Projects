package entity.particle;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;

import level.Level;
import level.tile.TileList;

public class Particle {

	protected double x;
	protected double y;
	protected double dx;
	protected double dy;
	protected int life;
	protected int size;
	protected Level level;
	protected Color c;
	
	public Particle() {
		
	}
	
	public Particle(int x,int y,double dx,double dy,int size,int life,Color c) {
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.life = life;
		this.size = size;
		this.c = c;
		this.level = input.Event.getCurrentLevel();
		if (size == 0) { size = 1;}
	}
	
	public boolean tick() {
		x += dx;
		y += dy;
		life--;
		if (level.getTile( (double) x + size / 2, (double) y + size / 2).getType() == TileList.TILE_SOLID) {
			dx = 0;
			dy = 0;
		}
		if (life <= 0) { return true;} else { return false;}
	}
	
	public void render(Graphics g) {
		g.setColor(c);
		g.fillOval((int) (x + input.Event.getCurrentLevel().getX()),(int) (y + input.Event.getCurrentLevel().getY()),size,size);
	}
	
	public double getX() { return x;}
	public double getY() { return y;}
	public void addVelocity(double dx,double dy) {
		this.dx += dx;
		this.dy += dy;
	}
	
	public void setVelocity(double dx,double dy) {
		this.dx = dx;
		this.dy = dy;
	}
	
	public void setPos(int x,int y) {
		this.x = x;
		this.y = y;
	}
	
	public void setLife(int i) {this.life = i;}
	
	
}
