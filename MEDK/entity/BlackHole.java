package entity;

import java.awt.Color;
import java.awt.Graphics;
import java.util.ArrayList;

import entity.particle.Particle;
import entity.particle.ParticleEmitter;

import level.Level;

public class BlackHole extends Entity {
	
	private double maxForce;
	private double range;
	
	public BlackHole() {
		this.level = input.Event.getCurrentLevel();
		this.controlsEnabled = false;
		this.alive = true;
		this.damageDone = 0;
		this.gravity = 0;
		this.width = 100;
		this.height = 100;
		this.range = 1000;
		this.maxForce = 0.5;
	}
	
	public void update() {
		
		ArrayList<Entity> entities = level.getEntities();
		for (int i = 0 ; i < entities.size() ; i++) {
			Entity e = entities.get(i);
			double distance = Math.sqrt(Math.pow(e.getX() - this.x,2) + Math.pow(e.getY() - this.x,2));
			if (distance < range && e != this) {
				double fx = (this.x - e.getX()) / distance;
				double fy = (this.y - e.getY()) / distance;
				e.addVelocity(fx * 6,fy * 6);
				if (distance < 200) {
					entities.remove(i);
				}
				
			}
		}
		
		ArrayList<ParticleEmitter> emitters = level.getParticleEmitters();
		Particle[] particles;
		for (int i = 0 ; i < emitters.size() ; i++) {
			particles = emitters.get(i).getParticles();
			for (int x = 0 ; x < particles.length ; x++) {
				Particle e = particles[x];
				double distance = Math.sqrt(Math.pow(e.getX() - this.x,2) + Math.pow(e.getY() - this.x,2));
				if (distance < range) {
					double fx = (this.x - e.getX()) / distance;
					double fy = (this.y - e.getY()) / distance;
					e.addVelocity(fx * 2,fy * 2);
					if (distance < 500) {
						e.setPos((int)this.x,(int)this.y);
					}
					
				}
			}
		}
		particles = input.Event.getCurrentLevel().getWeatherEmitter().getParticles();
		for (int x = 0 ; x < particles.length ; x++) {
			Particle e = particles[x];
			double distance = Math.pow(this.x - e.getX(),2) + Math.pow(this.y - e.getY(),2);
			if (distance < range) {
				double percentage = (distance / range);
				double vx = (this.x - e.getX()) / percentage / 100;
				double vy = (this.y - e.getY()) / percentage / 100;
				if (vx > maxForce) { vx = maxForce;}
				if (vx < -maxForce) { vx = -maxForce;}
				if (vy > maxForce) { vy = maxForce;}
				e.addVelocity(vx,vy);
				if (distance < (110 * 110)) {
					e.setVelocity(0,0);
					e.setLife(0);
				}
			}
		}
	}
	
	public void render(Graphics g) {
		g.setColor(Color.RED);
		g.fillOval((int) (level.getX() + x - (width / 2)) ,(int) (level.getY() + y - (height / 2)),width,height);
	}
	
	public void addVelocity(double dx,double dy) {}
	public void setVelocity(double dx,double dy) {}
	public void collision() {}
	public void movement() {}
}
