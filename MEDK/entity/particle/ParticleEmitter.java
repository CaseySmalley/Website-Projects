package entity.particle;

import input.Event;

import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.util.ArrayList;

import level.Level;

import entity.Entity;

public class ParticleEmitter extends Entity {
	
	protected boolean automatic;
	protected double xOff;
	protected double yOff;
	protected int life;
	protected int particle;
	protected long waitTime;
	protected long lastWait;
	protected Color c;
	protected Entity parent;
	protected ArrayList <Particle> particles;
	public static final int PARTICLE = 0;
	public static final int FIRE = 1;
	public static final int EXPLOSION = 2;
	public static final int RAIN = 3;
	public static final int SNOW = 4;
	
	public ParticleEmitter(int x,int y,int life,Color c,int particle) {
		super(null);
		this.width = 20;
		this.height = 20;
		this.x = x;
		this.y = y;
		this.c = c;
		this.particle = particle;
		this.life = life;
		this.particles = new <Particle>ArrayList(50);
	}
	
	public ParticleEmitter(int x,int y,int life,Color c,int particle,double delay) {
		super(null);
		this.width = 20;
		this.height = 20;
		this.x = x;
		this.y = y;
		this.c = c;
		this.particle = particle;
		this.life = life;
		this.automatic = true;
		this.waitTime = (long) (1000 / delay);
		this.particles = new <Particle>ArrayList(50);
	}
	
	public void update() {
		
	}
	
	public boolean tick() {
		update();
		if (automatic) { checkTime();}
		if (parent != null) {
			this.x = (int) (parent.getX() + (parent.getWidth() / 2));
			this.y = (int) (parent.getY() + (parent.getHeight() - 10));
		}
		
		for (int i = 0 ; i < particles.size() ; i++) {
			if (particles.get(i).tick()) {
				particles.remove(i);
			}
		}
		
		if (particle == EXPLOSION && particles.size() == 0 && automatic == false) {
			return false;
		}
			return true;
	}
	
	public void render(Graphics g) {
		for (int i = 0 ; i < particles.size() ; i++) {
			particles.get(i).render( (Graphics2D) g);
		}
	}
	
	public void checkTime() {
		if (System.currentTimeMillis() - lastWait > waitTime) {
			int mapWidth = Event.getCurrentLevel().getMapWidth() * Event.getCurrentLevel().getTileSize() - 140;
			lastWait = System.currentTimeMillis();
			switch(particle) {
			case PARTICLE:
				particles.add(new Particle((int) x,(int) y,Math.random() * 360 - 180,Math.random() * 5,(int) (Math.random() * 30),(int) (Math.random() * life),c));
				break;
				
			case FIRE:
				particles.add(new Fire((int) (x + xOff),(int) (y + yOff),( Math.random() * 80 - 40 ) ,Math.random() * 3,(int) (Math.random() * 10) + 1,(int) (Math.random() * life),c));
				break;
				
			case EXPLOSION:
				automatic = false;
				for (double x = -180 ; x < 180 ; x += Math.random() * 50) {
					for (double y = -180 ; y < 180 ; y += Math.random() * 50) {
						addParticle(new Particle((int) this.x,(int) this.y,x/25,y/25,(int) (Math.random() * 30),(int) (Math.random() * life),c));
					}
				}
				break;
				
			case RAIN:
				particles.add(new Rain((int) (Math.random() * mapWidth),(int) y,Math.random() * -2.2 + 4.4,Math.random() * 10 + 20,(int) (Math.random() * 12),c));
				break;
				
			case SNOW:

				particles.add(new Snow((int) (Math.random() * mapWidth),(int) y,Math.random() * 2 - 2,Math.random() * 3,(int) (Math.random() * 12),c));
				break;
			}
		}
	}
	
	public void setParent(Entity e) { this.parent = e;}
	public void addParticle(Particle p) { particles.add(p);}
	public void setPos(double x,double y) {
		this.x = x;
		this.y = y;
	}
	public void setOffset(double x,double y) {
		this.xOff = x;
		this.yOff = y;
	}
	public double getX() { return x;}
	public double getY() { return y;}
	public int getParticleType() { return particle;}
	public Particle[] getParticles() {
		Particle[] particles = new Particle[this.particles.size()];
			for (int i = 0 ; i < this.particles.size(); i++) {
				particles[i] = this.particles.get(i);
			}
		return particles;
	}
	
}
