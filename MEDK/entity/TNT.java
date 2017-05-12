package entity;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.util.ArrayList;

import textures.Sprites;

import entity.particle.ParticleEmitter;
import level.Level;
import level.tile.Tile;
import level.tile.BedRock;

public class TNT extends Entity {

	private Sprites spriteSheet;
	private int radius;
	
	public TNT() {
		this.level = input.Event.getCurrentLevel();
		this.controlsEnabled = false;
		this.moveSpeed = 0.4;
		this.maxMoveSpeed = 5;
		this.jumpStart = -10;
		this.width = 50;
		this.height = 50;
		this.radius = 1;
		this.spriteSheet = new Sprites("resource/TNTSprites.png",height,width);
		this.alive = true;
		this.damageDone = 0;
		this.killWait = 200;
		this.life = 3 + (int) (Math.random() * 7);
		this.stopSpeed = 0.5;
	}
	
	public void damage() {
		kill();
	}
	
	public void life() {
		if (dying) {
			if (!firstDeath) {
				firstDeath = true;
				this.emitter = new ParticleEmitter(0,0,40,new Color(133,133,133),ParticleEmitter.FIRE,100);
				this.emitter.setOffset(0,-height / 2);
				this.emitter.setParent(this);
				this.killLastCount = System.currentTimeMillis();

			}
			if (System.currentTimeMillis() - killLastCount > killWait) {
				killLastCount = System.currentTimeMillis();
				life--;
				// animation
				
				
				if (life <= 0) {
					int currRow = (int) (this.x + (width / 2)) / level.getTileSize();
					int currCol = (int) (this.y + (height / 2)) / level.getTileSize();
					for (int x = currRow - radius ; x < currRow + radius + 1 ; x++) {
						for (int y = currCol - radius ; y < currCol + radius + 1 ; y++) {
							if (x > -1 && x < level.getMapWidth() && y > -1 && y < level.getMapHeight()
									&& level.getTile(x,y).getClass() != BedRock.class) { 
								int water = level.getTile(x,y).getAmount();
								level.setTile(x,y,new Tile());
								level.getTile(x,y).setAmount(water);
								
							}	
						}
					}
							
					Entity[] el = level.getDrawnEntities();
					for (int i = 0 ; i < el.length ; i++) {
						Entity e = el[i];
						double x = (currRow - radius - 1) * level.getTileSize();
						double y = (currCol - radius - 1) * level.getTileSize();
						int width = (int) (((currRow + radius + 1) * level.getTileSize()) - x);
						int height = (int) (((currCol + radius + 1) * level.getTileSize()) - y);
						if (e.isTouching(new Entity(null,x,y,width,height))) {
							double distance = (int) Math.sqrt(Math.pow(this.x - e.getX(),2) + Math.pow(this.y - e.getY(),2));
							double fx = (e.getX() - this.x) / distance;
							double fy = (e.getY() - this.y) / distance;
							e.addVelocity(fx * 10,fy * 10);
							e.kill();
						}
					}
					
					level.addEmitter(new ParticleEmitter((int)x,(int)y,40,new Color(255,100,100),ParticleEmitter.EXPLOSION,100));
					alive = false;
				}
			}
		}
	}
	
	
	public void render(Graphics g) {
		g.setColor(Color.RED);
		g.drawImage(spriteSheet.getFrame(0,0),(int) (this.x + level.getX()),(int) (this.y + level.getY()),null);
		if (emitter != null) {emitter.render(g);}
	}

}
