package entity.particle;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;

import level.tile.Tile;
import level.tile.TileList;

public class Fire extends Particle {
	
	public Fire(int x,int y,double angle,double mag,int size,int life,Color c) {
		this.x = x;
		this.y = y;
		this.dx = Math.cos(angle) * mag;
		this.dy = -1;
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
		if (dx < 0 && dx != 0) {
			dx += 0.1;
		} else if (dx > 0 && dx != 0) {
			dx -=0.1;
		}
		Tile t = level.getTile( (double) x + size / 2, (double) y + size / 2);
		if (t.getType() == TileList.TILE_SOLID) {
			dy = 0;
			dx = 0;
		}
		if (life <= 0) { return true;} else { return false;}
	}
	
	public void render(Graphics g) {
		level.getTile( (double) x + size / 2, (double) y + size / 2).setBrightness(0f);
		g.setColor(c);
		g.fillOval((int) (x + input.Event.getCurrentLevel().getX()),(int) (y + input.Event.getCurrentLevel().getY()),size,size);
	}
	
}
