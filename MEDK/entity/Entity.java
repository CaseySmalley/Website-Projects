package entity;

import java.awt.Graphics;
import java.awt.Color;
import java.awt.Graphics2D;

import entity.particle.ParticleEmitter;
import level.Level;
import level.tile.Tile;
import level.tile.TileList;

public class Entity {

	// this is a base class for all entities which has code for collision detection and movement
	// this class is never instanciated but instead it is inherited from other more specific types of entities
	
	protected String name = "";
	protected String reference = "";
	protected long killWait;
	protected long killLastCount;
	protected long lastDamage;
	protected int width;
	protected int height;
	protected int life;
	protected int health = 4;
	protected int damageDone = 1;
	protected int type;
	protected double x;
	protected double y;
	protected double dx;
	protected double dy;
	protected double offX;
	protected double offY;
	protected double moveSpeed;
	protected double maxMoveSpeed;
	protected double gravity;
	protected double maxGravity;
	protected double stopSpeed;
	protected double jumpStart;
	protected boolean controlsEnabled = true;
	protected boolean alpha = true;
	protected boolean invincible;
	protected boolean isHostile;
	protected boolean jumping;
	protected boolean left;
	protected boolean right;
	protected boolean falling;
	protected boolean swimming;
	protected boolean touchLeft;
	protected boolean touchRight;
	protected boolean touchUp;
	protected boolean touchDown;
	protected boolean topRight;
	protected boolean topLeft;
	protected boolean bottomRight;
	protected boolean bottomLeft;
	protected boolean alive;
	protected boolean firstDeath;
	protected boolean dying;
	protected Entity parent;
	protected ParticleEmitter emitter;
	protected Level level;
	
	public Entity() {
		this.level = input.Event.getCurrentLevel();
	}
	
	public Entity(Level level) {
		this.level = level;
	}
	
	public Entity(Level level,double x,double y,int width,int height) {
		this.level = level;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	// getters/setters for important variables (to avoid accidental data changes)
	public String getReference() { return reference;}
	public int getDamageDone() { return damageDone;}
	public int getWidth() { return width;}
	public int getHeight() { return height;}
	public int getType() { return type;}
	public double getX() { return x;}
	public double getY() { return y;}
	public double getDx() { return dx;}
	public double getDy() { return dy;}
	public boolean getLeft() {return left;}
	public boolean getRight() {return right;}
	public boolean getJumping() {return jumping;}
	public boolean getFalling() {return falling;}
	public boolean getDying() { return dying;}
	public boolean isHostile() { return isHostile;}
	public boolean getAlpha() { return alpha;}
	public void setAlpha(boolean b) { this.alpha = b;}
	public void setDx(double d) { this.dx = d;}
	public void setDy(double d) { this.dy = d;}
	public void setHealth(int i) { this.health = i;}
	public void kill() { 
		dying = true;
	}
	public void setPos(double x,double y) {
		this.x = x;
		this.y = y;
	}
	
	public void setName(String s) {
		this.name = s;
	}
	
	public void setVelocity(double dx,double dy) {
		this.dx = dx;
		this.dy = dy;
		checkSpeed();
	}
	
	public void addVelocity(double dx,double dy) {
		this.dx += dx;
		this.dy += dy;
		checkSpeed();
	}
	
	public void checkSpeed() {
		if (dx > 100) { dx = 100;}
		if (dx < -100) { dx = -100;}
		if (dy > 100) { dy = 100;}
		if (dy < -100) { dy = -100;}
	}
	
	public void setParent(Entity e) { 
		this.parent = e;
		this.offX = e.getX() - this.x;
		this.offY = e.getY() - this.y;
		// parents the called entity to the one given as an argument
		// ingame it means regardless of position this entity now moves relative to its parent
	}
	public void setMaxSpeed(double d) { this.maxMoveSpeed = d;}
	public void setHostile(boolean b) { this.isHostile = b;}
	public void setAlive(boolean b) { this.alive = b;}
	public void setReference(String s) { this.reference = s;}
	public void setControls(boolean b) { this.controlsEnabled = b;}
	public void setLeft(boolean b) { if (controlsEnabled) {this.left = b;}}
	public void setRight(boolean b) { if (controlsEnabled) {this.right = b;}}
	public void setJumping(boolean b) {if (controlsEnabled) {
		checkCorners(x,y + 1,TileList.TILE_WATER);
		if (!falling || swimming ) {this.jumping = b;}
	}}
	
	public boolean tick() {
		// updating the entities logic
		movement();
		collision();
		if (emitter != null) { emitter.tick();}
		update();
		life();
		return alive;
		// returns if the entity has been killed or not
	}
	
	public void damage() {
		// called when an entity has collided with another "hostile" entity
		// it takes one of this entities health and gives it a small period where it can't
		// be damaged again
		if (System.currentTimeMillis() - lastDamage > 250 && !invincible) {
			health--;
			if (health <= 0) {
				kill();
			}
			lastDamage = System.currentTimeMillis();
		} else {
			invincible = true;
		}
	}
	
	public void checkEntityCollision() {
		
		// the entity in question is checked to see if it colling with any other entity drawn on the screen
		// if it is and this entity is hostile then the damage method is called
		Entity[] el = level.getDrawnEntities();
		for (int i = 0 ; i < el.length ; i++) {
			if (el[i] != this && ((el[i].getClass() != TNT.class && el[i].getClass() != BlackHole.class) || el[i].isHostile)) {
			if (el[i].isTouching(this) && !el[i].getDying() && !dying && ( isHostile || el[i].isHostile())) {
				if (falling && this.y < el[i].getY()) {
					el[i].damage();
						setVelocity(0,jumpStart);
				} else {
						if (!el[i].getDying()) {
							damage();
							}
				}
			}
		}	
			
		
		if (System.currentTimeMillis() - lastDamage > 250) {
			invincible = false;
		}
	}
	}
	
	public void update() {}
	public void action() {}
	
	public void life() {
		if (dying) {
			if (!firstDeath) {
				firstDeath = true;
				controlsEnabled = false;
				left = false;
				right = false;
				this.killLastCount = System.currentTimeMillis();
				this.emitter = new ParticleEmitter((int)x,(int)y,20,new Color(250,200,0),ParticleEmitter.FIRE,100);
				this.emitter.setParent(this);
			}
			if (System.currentTimeMillis() - killLastCount > killWait) {
				killLastCount = System.currentTimeMillis();
				life--;
				if (life <= 0) {
					alive = false;
				}
			}
		}
	}
	
	public void movement() {
		// this method updates the entities movement logic based on what direction they are suppost to be going in
		double moveSpeed;
		double maxMoveSpeed;
		double stopSpeed;
		double gravity;
		double maxGravity;
		double jumpStart;
		// a check to see if the entity is in a tile with water
		// if so then its maximum movement and acelleration are halved
		if (!swimming) {
			moveSpeed = this.moveSpeed;
			maxMoveSpeed = this.maxMoveSpeed;
			stopSpeed = this.stopSpeed;
			gravity = level.getGravity();
			maxGravity = level.getMaxGravity();
			jumpStart = this.jumpStart;
		} else {
			moveSpeed = this.moveSpeed / 2;
			maxMoveSpeed = this.maxMoveSpeed / 2;
			stopSpeed = this.stopSpeed / 2;
			gravity = level.getGravity() / 2;
			maxGravity = level.getMaxGravity() / 4;
			jumpStart = this.jumpStart / 2;
		}
		
		// if the entity is moving left
		// then add an acelleration to its x velocity
		// if this velocity exceed the maximum speed
		// then make it equal to the maximum speed
		if (left) {
			dx -= moveSpeed;
			if (dx < -maxMoveSpeed) {
				dx = -maxMoveSpeed;
			}
		} else if (dx < 0 && !falling) {
			dx += stopSpeed;
			if (dx > 0) {
				dx = 0;
			}
			
		}
		
		if (right) {
			dx += moveSpeed;
			if (dx > maxMoveSpeed) {
				dx = maxMoveSpeed;
			}
		} else if (dx > 0 && !falling) {
			dx -= stopSpeed;
			if (dx < 0) {
				dx = 0;
			}
		}
		
		if (falling) {
			dy += gravity;
			if (dy > maxGravity) {
				dy = maxGravity;
			}
		}
		
		if (jumping) {
			jumping = false;
			dy = jumpStart;
			falling = true;
		}
	}
	
	public void collision() {
		double tempX = x;
		double tempY = y;
		double toX = x + dx;
		double toY = y + dy;
		int currRow = (int) (y / level.getTileSize());
		int currColl = (int) (x / level.getTileSize());
		Tile t =level.getTile(x + (width / 2),y + (height / 2));
		if (!t.getScript().equals("")) {
			input.Console.addScript(t.getScript(),this);
		}
		if (damageDone != 0) {checkEntityCollision();}
		
		checkCorners(toX,y,TileList.TILE_SOLID);
		// the corners of the entity in its next predicted x position are checked to see
		// if it go into a solid tile
		// if so then its x velocity is set to zero
		// if not then the velocity is added onto its x co-ordinate
		if (dx < 0) {
			if (topLeft || bottomLeft) {
				dx = 0;
			} else {
				tempX += dx;
			}
		}
		
		if (dx > 0) {
			if (topRight || bottomRight) {
				dx = 0;
			} else {
				tempX += dx;
			}
		}
		
		checkCorners(x,toY,TileList.TILE_SOLID);
		// the same type of check is done in the y axis
		if (dy < 0) {
			if (topLeft || topRight) {
				dy = 0;
			} else {
				tempY += dy;
			}
		}
		
		if (dy > 0) {
			if (bottomLeft || bottomRight) {
				dy = 0;
				falling = false;
				tempY = (currRow + 1) * level.getTileSize() - height - 1;
			} else {
				tempY += dy;
			}
		}
		
		// it checks if the tile that is one pixel below the entity is solid
		// if not then it is set to fall
		checkCorners(x,y + 1,TileList.TILE_SOLID);
		if (!bottomLeft && !bottomRight) {
			falling = true;
		}
	
		
		// checking if the entity is in water
		checkCorners(x,y,TileList.TILE_WATER);
		if (topLeft || topRight || bottomLeft || bottomRight) {
			swimming = true;
		} else if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
			swimming = false;
		}
		
		if (parent != null) {
			x = parent.getX() + offX;
			y = parent.getY() + offY;
		}
		
		x = tempX;
		y = tempY;
	}
	
	public void checkCorners(double x,double y, int type) {
		// this function checks each corner of an entities bounding box
		// to see if tile at each corner is equal to the type of tile
		// passed in to the function (sold, water or air types)
		topLeft = level.getTile(x,y).getType() == type;
		topRight = level.getTile(x + width,y).getType() == type;
		bottomLeft = level.getTile(x,y + height).getType() == type;
		bottomRight = level.getTile(x + width,y + height).getType() == type;
	}
	
	public boolean isTouching(Entity e) {
		// a method that compares the size and position
		// of two entities to check if they are "colliding"
        int tw = this.width;
        int th = this.height;
        int rw = e.getWidth();
        int rh = e.getHeight();
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        int tx = (int) this.x;
        int ty = (int) this.y;
        int rx = (int) e.getX();
        int ry = (int) e.getY();
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        return ((rw < rx || rw > tx) &&
                (rh < ry || rh > ty) &&
                (tw < tx || tw > rx) &&
                (th < ty || th > ry));
    }
	
	public void draw(Graphics g) {
		// a method that can be overwritten by classes that inherit from this one
		if (invincible) {
			g.setColor(Color.WHITE);
			g.drawString(""+health,(int) (level.getX() + (x -width/2 ) + 10),(int) (level.getY() + y - (height/2)) - 20);
		}
	}
	
	public void render(Graphics g) {
		g.setColor(Color.RED);
		g.fillRect((int) (level.getX() + x) ,(int) (level.getY() + y),width,height);
		g.setColor(Color.WHITE);
		g.drawString(name,(int) (level.getX() + (x -width/2 ) - ( (2 * name.length()) / 2)),(int) (level.getY() + y - (height/2)) );
		if (emitter != null) { emitter.render((Graphics2D) g);}
		draw(g);
	}
	
}
