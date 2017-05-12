package entity.particle;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;

import level.Level;
import level.tile.Tile;
import level.tile.TileList;

public class Rain extends Particle {

	private double x;
	private double y;
	private double dx;
	private double dy;
	private int size;
	private Level level;
	private Color c;
	
	public Rain(double x,double y,double dx,double dy,int size,Color c) {
		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.size = size;
		this.life = 1;
		this.c = c;
		this.level = input.Event.getCurrentLevel();
		if (size == 0) { size = 1;}
	}
	
	public boolean tick() {
		x += dx;
		y += dy;
		Tile t = level.getTile( (int) ( (this.x - (size / 2)) / level.getTileSize()),(int) ( (this.y - (size / 2)) / level.getTileSize()));
		Tile t1 = new Tile();
		if ( !((int) (this.y / level.getTileSize()) <= 1) )
				{t1 = level.getTile( (int) ( (this.x - (size / 2)) / level.getTileSize()),(int) ( (this.y - (size / 2)) / level.getTileSize()) - 1);}
		if (t.getType() == TileList.TILE_SOLID) {
			if (t1.getType() != TileList.TILE_SOLID || t.getAmount() != 0) {
				t.setSnow(false);
			}
			return true;
		} else {
			if (life == 0) {
				return true;
			} else {
				return false;
			}
		}
	}

	public boolean checkLevelRender() {
		boolean drawn = true;
		if (this.x > -level.getX() && this.x < (-level.getX() + level.getScreenWidth())) {
			if (this.y > -level.getY() && this.x < (-level.getY() + level.getScreenHeight())) {
				drawn = false;
			}
		}
		return drawn;
	}
	
	public void render(Graphics g1) {
		Graphics2D g = (Graphics2D) g1;
		g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) 0.7));
		g.setColor(c);
		g.fillOval((int) (x + input.Event.getCurrentLevel().getX()),(int) (y + input.Event.getCurrentLevel().getY()),size,size);
	}
	
	public double getX() { return this.x;}
	public double getY() { return this.y;}
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
	
	public void setLife(int i) { this.life = i;}
	
	
}
