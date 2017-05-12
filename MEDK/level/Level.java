package level;

import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.Color;
import java.awt.Image;
import java.awt.RenderingHints;
import java.awt.Toolkit;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.BufferedWriter;
import java.util.ArrayList;
import javax.imageio.ImageIO;

import textures.Sprites;
import entity.*;
import entity.particle.*;
import level.tile.*;

public class Level {

	private double x;
	private double y;
	private double bx;
	private double by;
	private double gravity;
	private double maxGravity;
	private boolean weather;
	private boolean AA;
	private boolean day = true;
	private boolean lighting;
	private boolean state;
	private boolean highlightScripts;
	private boolean first;
	private int tileSize;
	private int mapWidth;
	private int mapHeight;
	private int maxEntities;
	private int screenWidth;
	private int screenHeight;
	private long lastWaterUpdate;
	private Image background;
	private String backgroundSRC;
	private Sprites tileTextures;
	private Tile[][] world;
	private Color FGColor;
	private Color BGColor;
	private Entity renderTarget;
	private static ParticleEmitter weatherEmitter;
	private ArrayList <Entity> entities;
	private ArrayList <ParticleEmitter> emitters;
	
	public Level(String s,int tileSize) {
		input.Event.setLevel(this);
		// this sets the "current level" as the most recent level that was initalized
		// so a level can be constructed without assigning it to anything e.g. "new Level()"
		this.FGColor = Color.BLACK;
		this.BGColor = Color.BLACK;
		this.day = true;
		this.lighting = false;
		this.screenWidth = (int) java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth();
		this.screenHeight = (int) java.awt.Toolkit.getDefaultToolkit().getScreenSize().getHeight();
		this.tileTextures = new Sprites("resource/tileTextures.png",tileSize,tileSize);
		this.tileSize = tileSize;
		this.gravity = 0.5;
		this.maxGravity = 10;
		this.entities = new <Entity> ArrayList(10);
		this.emitters = new <ParticleEmitter> ArrayList(10);
		this.AA = true;
		try {
			String sc = s.replace("resource/","");
			if (input.Script.getScriptFile(sc) != null) { 
				input.Console.addScript(sc,null);
				// if a script file with the same name as the level exists, then execute it
			}
			// tile setup
			// tile ID's seperated by spaces are processed line by line
			BufferedReader br = new BufferedReader(new FileReader(s));
			mapWidth = Integer.parseInt(br.readLine());
			mapHeight = Integer.parseInt(br.readLine());
			world = new Tile[mapWidth][mapHeight];
			for (int y = 0 ; y < mapHeight ; y++) {
				String[] tokens = br.readLine().split(" ");
				for (int x = 0 ; x < mapWidth ; x++) {
					world[x][y] = TileList.getTile(Integer.parseInt("" + tokens[x].charAt(0)),Integer.parseInt("" + tokens[x].charAt(1)),Integer.parseInt("" + tokens[x].charAt(2)),Integer.parseInt("" + tokens[x].charAt(3)),x,y);
				}
			}
			// entity setup
			this.maxEntities = Integer.parseInt(br.readLine());
			for (int i = 0; i < maxEntities ; i++) {
				String[] tokens = br.readLine().split(" ");
				double x = Integer.parseInt(tokens[1]) * tileSize;
				double y = Integer.parseInt(tokens[2]) * tileSize;
				Entity e = EntityList.getEntity(Integer.parseInt(tokens[0]),x,y);
				if (tokens.length == 4) {
					e.setReference(tokens[3]);
				}
				addEntity(e);
			}
			// script setup
			int maxScripts = Integer.parseInt(br.readLine());
			for (int i = 0 ;i < maxScripts ; i++) {
				String[] tokens = br.readLine().split(" ");
				int x = Integer.parseInt(tokens[0]);
				int y = Integer.parseInt(tokens[1]);
				world[x][y].setScript(tokens[2]);
			}
			
			// load background
			backgroundSRC = br.readLine();
			//background = ImageIO.read(new File(backgroundSRC));
			br.close();
		} catch(Exception e) {}
		if (!input.Console.getLogEnabled()) {
		for (int y1 = 0 ; y1 < mapHeight ; y1++) {
			String line = "";
			for (int x1 = 0 ; x1 < mapWidth ; x1++) {
				Tile t = world[x1][y1];
				line += " " + t.getID()[0] + t.getID()[1] + t.getType() + t.getFunction();
			}
		}
		}
		// boolean that is used to check when this constructor has finished
	first = true;
	}
	
	public Level(int mapWidth,int mapHeight,boolean b,int tileSize) {
		input.Event.setLevel(this);
		world = new Tile[mapWidth][mapHeight];
		this.FGColor = Color.BLACK;
		this.BGColor = Color.BLACK;
		this.entities = new <Entity> ArrayList(10);
		this.emitters = new <ParticleEmitter> ArrayList(10);
		this.tileTextures = new Sprites("resource/tileTextures.png",tileSize,tileSize);
		this.screenWidth = (int) java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth();
		this.screenHeight = (int) java.awt.Toolkit.getDefaultToolkit().getScreenSize().getHeight();
		this.tileSize = tileSize;
		this.gravity = 0.5;
		this.maxGravity = 10;
		this.mapWidth = mapWidth;
		this.mapHeight = mapHeight;
		this.AA = true;
		
		// creating the border for the level
		for (int x = 0; x < mapWidth ; x++) {
			for (int y = 0; y < mapHeight ; y++) {
				world[x][y] = new Tile();
			}
		}
		int x = 0;
		int y = 0;
		for (x = 0 ; x < mapWidth ; x++) {
			world[x][y] = new BedRock();
		}
		x = 0;
		for (y = 0 ; y < mapHeight ; y++) {
			world[x][y] = new BedRock();
		}
		y = mapHeight - 1;
		for (x = 0 ; x < mapWidth ; x++) {
			world[x][y] = new BedRock();
		}
		x = mapWidth - 1;
		for (y = 0 ; y < mapHeight ; y++) {
			world[x][y] = new BedRock();
		}
		// random terrain (if enabled)
		if (b) {
		int yStart = (int) (Math.random() * mapHeight);
		for (x = 1 ; x < mapWidth - 1 ; x++) {
		world[x][yStart] = new Dirt_Grass();
			for (y = yStart + 1 ; y < mapHeight - 1 ; y++) {
				world[x][y] = new Dirt();
			}
			double chance = Math.random();
			if (chance < 0.3) {
				yStart--;
			} else if (chance > 0.7) {
				yStart++;
			}
			
		}
		
		for (x = 1 ; x < mapWidth - 1 ; x++) {
			for (y = 1 ; y < mapHeight ; y++) {
				if (world[x][y].getType() == TileList.TILE_SOLID) {
					if (world[x - 1][y].getType() == TileList.TILE_AIR && world[x + 1][y].getType() == TileList.TILE_AIR) {
						world[x][y] = new Tile();
						world[x][y + 1] = new Dirt_Grass();
					}
				}
			}
		}
		
		world = new Tile[mapWidth][mapHeight];
		for (int x1 = 0 ; x1 < mapWidth ; x1++) {
			for (int y1 = 0 ; y1 < mapHeight ; y1++) {
				Tile t = new Tile();
				int i = (int) (Math.random() * 6);
				switch(i) {
				case 0: t = new Brick(); break;
				case 1: t = new Dirt(); break;
				case 2: t = new Wood(); break;
				case 3: t = new Stone(); break;
				case 4: t = new Torch();  break;
				case 5: t = new Log(); break;
				}
				t.setType(TileList.TILE_AIR);
				world[x1][y1] = t;
			}
		}
		
		}
		first = true;
	}
	
	public void tick() {
		// every entity's tick method is called and if ant return false (if it is dead) then it is removed
		for (int i = 0 ; i < entities.size() ; i++) {
			if (!entities.get(i).tick()) { entities.remove(i);}
		}
		
		// every particle emitter has it's tick method called / if any have been flagged to be deleted then it is removed
		for (int i = 0 ; i < emitters.size() ; i++) {
			if(!emitters.get(i).tick()) {
				emitters.remove(i);
			}
		}
		
		// if the weather effect has been enabled then the emitter is updated
		if (weather && weatherEmitter != null) {weatherEmitter.tick();}
		
		if (renderTarget == null) {
		
		
		} else {
			// if there is a render target then the level is panned depending on the render targets position
			x = (-renderTarget.getX() + (Toolkit.getDefaultToolkit().getScreenSize().getWidth() / 2));
			y = (-renderTarget.getY() + (Toolkit.getDefaultToolkit().getScreenSize().getHeight() / 2));
		}
		
		if (x > 0) {x = 0;}
		if (y > 0) {y = 0;}
		if (y < -(mapHeight * tileSize - Toolkit.getDefaultToolkit().getScreenSize().getHeight())) { 
			y = -(mapHeight * tileSize - Toolkit.getDefaultToolkit().getScreenSize().getHeight());
		}
		if (x < -(mapWidth * tileSize - Toolkit.getDefaultToolkit().getScreenSize().getWidth())) {
			x = -(mapWidth * tileSize - Toolkit.getDefaultToolkit().getScreenSize().getWidth());
		}
	
		if (background != null) {
			// panning the background image
			// 10 times smaller on the x axis
			// 3 times smaller on the y axis
			// in order to create a better cosmetic effect
			bx = x / 10;
			by = y / 3;
		}
		// water logic
		if (System.currentTimeMillis() - lastWaterUpdate > 50) {
			int[][] temp = new int[mapWidth][mapHeight];
			for (int x = 0 ; x < mapWidth ; x++) {
				for (int y = 0 ; y < mapHeight ; y++) {
					temp[x][y] = -1;
				}
			}
			
			for (int x = 0 ; x < mapWidth ; x++) {
				for (int y = 0 ; y < mapHeight ; y++) {
					if (world[x][y].getType() == TileList.TILE_WATER) {
						if (state) {
							// left / right
							if (world[x - 1][y].getType() != TileList.TILE_SOLID && world[x + 1][y].getType() != TileList.TILE_SOLID && (world[x][y + 1].getType() == TileList.TILE_SOLID || world[x][y + 1].getType() == TileList.TILE_WATER)) {
								if (world[x - 1][y].getAmount() == world[x + 1][y].getAmount()) {
								int direction = (int) Math.round(Math.random() * 2);
								if (direction == 1) {
									if (world[x - 1][y].getAmount() < world[x][y].getAmount() && world[x][y].getAmount() > 1 && temp[x-1][y] == -1) {
										temp[x][y] = world[x][y].getAmount() - 1;
										temp[x - 1][y] = world[x - 1][y].getAmount() + 1;
									}
								} else if (direction == 2) {
									if (world[x + 1][y].getAmount() < world[x][y].getAmount() && world[x][y].getAmount() > 1 && temp[x+1][y] == -1) {
										temp[x][y] = world[x][y].getAmount() - 1;
										temp[x + 1][y] = world[x + 1][y].getAmount() + 1;
									}
								}
								} else {
									if (world[x - 1][y].getAmount() < world[x + 1][y].getAmount() &&
											world[x - 1][y].getAmount() < world[x][y].getAmount() && world[x][y].getAmount() > 1 && temp[x-1][y] == -1) {
										temp[x][y] = world[x][y].getAmount() - 1;
										temp[x - 1][y] = world[x - 1][y].getAmount() + 1;
									}
									
									if (world[x + 1][y].getAmount() < world[x - 1][y].getAmount() &&
											world[x + 1][y].getAmount() < world[x][y].getAmount() && world[x][y].getAmount() > 1 && temp[x+1][y] == -1) {
										temp[x][y] = world[x][y].getAmount() - 1;
										temp[x + 1][y] = world[x + 1][y].getAmount() + 1;
									}
								}
							
							} else if (world[x - 1][y].getType() == TileList.TILE_SOLID && world[x + 1][y].getType() != TileList.TILE_SOLID && (world[x][y + 1].getType() == TileList.TILE_SOLID || world[x][y + 1].getType() == TileList.TILE_WATER)) {
								if (world[x][y].getAmount() > world[x + 1][y].getAmount() && world[x][y].getAmount() > 1  && temp[x+1][y] == -1) {
									temp[x][y] = world[x][y].getAmount() - 1;
									temp[x + 1][y] = world[x + 1][y].getAmount() + 1;
								}
							} else if (world[x + 1][y].getType() == TileList.TILE_SOLID && world[x - 1][y].getType() != TileList.TILE_SOLID && (world[x][y + 1].getType() == TileList.TILE_SOLID || world[x][y + 1].getType() == TileList.TILE_WATER)) {
								if (world[x][y].getAmount() > world[x - 1][y].getAmount() && world[x][y].getAmount() > 1 && temp[x-1][y] == -1) {
									temp[x][y] = world[x][y].getAmount() - 1;
									temp[x - 1][y] = world[x - 1][y].getAmount() + 1;
								}
							}
							                                                              
							
							if (temp[x][y] > 4) {  temp[x][y] = 4;}
						} else {
					
							if (world[x][y + 1].getType() != TileList.TILE_SOLID) {
								// below
								if (world[x][y + 1].getType() == TileList.TILE_WATER) {
									if (world[x][y + 1].getAmount() < 4) {
										temp[x][y + 1] = world[x][y + 1].getAmount();
										temp[x][y] = world[x][y].getAmount();
										while(temp[x][y + 1] < 4 && temp[x][y] != 0) {
											temp[x][y + 1]++;
											temp[x][y]--;
										
										}
									}
								}
							
								if(world[x][y + 1].getType() == TileList.TILE_AIR) {
									temp[x][y + 1] = world[x][y].getAmount();
									temp[x][y] = 0;
								}
							} else if (world[x][y + 1].getType() == TileList.TILE_SOLID) {
								world[x][y + 1].setSnow(false);
							}
						
						}
					}
				}
			}
			
			
			
			for (int x = 0 ; x < mapWidth ; x++) {
				for (int y = 0 ; y < mapHeight ; y++) {
					if (temp[x][y] != -1) {
						world[x][y].setAmount(temp[x][y]);
					}
				}
			}
			state = !state;
			lastWaterUpdate = System.currentTimeMillis();
		}
		
		
	}
	public void render(Graphics2D g) {
		if (AA) {
			// anti aliasing
			g.setRenderingHint(RenderingHints.KEY_ANTIALIASING,RenderingHints.VALUE_ANTIALIAS_ON);
			g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		}
			g.setColor(BGColor);
			g.fillRect(0,0,screenWidth,screenHeight);
		if (background != null) {
			g.drawImage(background,(int) bx,(int) by,null);
			
		}
			
		// setting the bounds for where things are rendered (the area of the world covered by the screen)
		int xMin = (int) (-x / tileSize - 1);
		int xMax = (int) ((-x + java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth()) / tileSize + 1);
		int yMin = (int) (-y / tileSize - 1);
		int yMax = (int) ((-y + java.awt.Toolkit.getDefaultToolkit().getScreenSize().getHeight()) / tileSize + 1);
		if (xMin < 0) { xMin = 0;}
		if (xMax > mapWidth - 1) { xMax = mapWidth;}
		if (yMin < 0) { yMin = 0;}
		if (yMax > mapHeight - 1) { yMax = mapHeight;}
		// drawing the tiles to the frame
		for (int x = xMin ; x < xMax ; x++) {
			for (int y = yMin ; y < yMax ; y++) {
				double alpha = 1;
				if (world[x][y].getType() == TileList.TILE_AIR) {
					alpha = 0.6;
				}
				if (world[x][y].getClass() != Tile.class) {
					if (lighting && world[x][y].getBrightness() != 1f) {
						g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER,(float) alpha));
						g.drawImage(tileTextures.getFrame(world[x][y].getID()[0],world[x][y].getID()[1]),(int) (this.x + x * tileSize),(int) (this.y + y * tileSize),null);
					} else {
						g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER,(float) alpha));
						g.drawImage(tileTextures.getFrame(world[x][y].getID()[0],world[x][y].getID()[1]),(int) (this.x + x * tileSize),(int) (this.y + y * tileSize),null);
					}
				}
			}
		}
		// if highlighting script tiles is enabled
		// each tile with an associated script will have a red border with the name of the script file
		if (highlightScripts) {
			for (int x = 0 ; x < mapWidth ; x++) {
				for (int y = 0 ; y < mapHeight ; y++) {
					if (!world[x][y].getScript().equals("")) {
						g.setColor(Color.RED);
						g.drawRect((int) (x * tileSize + this.x),(int) (y * tileSize + this.y),tileSize,tileSize);
						g.setColor(Color.WHITE);
						g.drawString(world[x][y].getScript(),(int) (x * tileSize + this.x),(int) (y * tileSize + this.y));
					}
				}
			}
		}
		
		// setting up view area for lighting logic (making it all dark before calculating light)
		for (int x = xMin - 100 ; x < xMax + 100 ; x++) {
			for (int y = yMin - 100 ; y < yMax + 100 ; y++) {
				if (x > -1 && x < mapWidth && y > -1 && y < mapHeight) {
					world[x][y].setBrightness(1f);
				}
			}
		}
		
		// rendering particle emitters
		g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) 1));
		for (int i = 0 ; i < emitters.size() ; i++) {
			ParticleEmitter pe = emitters.get(i);
			if (checkRender(pe.getX(),pe.getY())) {
					pe.render(g);
			}
		}
		
		// rendering entities
		for (int i = 0 ; i < entities.size() ; i++) {
			Entity e = entities.get(i);
			if (checkRender(e.getX(),e.getY()) && e.getAlpha()) {
				e.render((Graphics2D) g);
			}
		}
		if (weather && weatherEmitter != null) {weatherEmitter.render(g);}
		for (int x = xMin ; x < xMax ; x++) {
			for (int y = yMin ; y < yMax ; y++) {
				if (world[x][y].getAmount() > 0) {
					// rendering water over a tile if it contains any
					g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) 0.3));
					g.drawImage(tileTextures.getFrame(3,4-world[x][y].getAmount()),(int) (this.x + x * tileSize),(int) (this.y + y * tileSize),null);
				} else if (world[x][y].getSnow()) {
					// drawing snow over a tile if it has collided with snow particles
					g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) 1));
					g.drawImage(tileTextures.getFrame(3,4),(int) (this.x + x * tileSize),(int) (this.y + y * tileSize),null);
				}
			}
		}
		
		if (lighting) {
			g.setColor(BGColor);
			// ambient lighting
			g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.2f));
			g.fillRect(0,0,screenWidth,screenHeight);
			
			//tile shading
			// all tiles that are away from light source have the light of
			// the adjecent tile but with less brightness
			// e.g. 1F = dark 0F = bright
			// if a tile has the brightness 0.5F then the ajecent will have 0.3F
			g.setColor(FGColor);
			for (int x = xMin ; x < xMax ; x++) {
				if (day) {
					for (int y = 1 ; y < mapHeight ; y++) {
						if (world[x][y].getType() == TileList.TILE_SOLID) {
							for (int dy = y - 1 ; dy > 0 ; dy--) {
								world[x][dy].setBrightness(0f);
							}
							break;
						}
					}
				}
			}
			for (int x = xMin ; x < xMax ; x++) {
				for (int y = yMin ; y < yMax ; y++) {
					checkBrightness(x,y);
					if (world[x][y].getBrightness() > 1f) { world[x][y].setBrightness(1f);}
				}
			}
			
			for (int x = xMax - 1 ; x > xMin ; x--) {
				for (int y = yMax - 1 ; y > yMin ; y--) {
					checkBrightness(x,y);
					if (world[x][y].getBrightness() > 1f) { world[x][y].setBrightness(1f);}
					if (world[x][y].getBrightness() != 0f) {
						g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER,world[x][y].getBrightness()));
						g.fillRect((int) (this.x + x * tileSize),(int) (this.y + y * tileSize),tileSize,tileSize);
					}
				}
			}
			
			
		}
		
		// drawing debug information
		g.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, (float) 1));
		g.setColor(Color.WHITE);
		g.drawString("X: " + x,(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),80);
		g.drawString("Y: " + y,(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),90);
		if (renderTarget != null) {
			g.drawString("RX: " + renderTarget.getX(),(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),100);
			g.drawString("RY: " + renderTarget.getY(),(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),110);
		}
		g.drawString("Anti Aliasing: " + AA,(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),120);
		g.drawString("Shader: " + lighting,(int) (Toolkit.getDefaultToolkit().getScreenSize().getWidth() - 100),130);
	}
	
	public void checkBrightness(int x,int y) {
		// checking the brightness of a specific tile in the world
		Tile t = world[x][y];
		float amount = 0.1f;
		// the amount that the brightness is increased by
		if (t.getType() == TileList.TILE_SOLID) { amount = 0.25f;}
		// solid blocks have a higher increment since they arn't really suppost to pass much light
		if (t.getType() == TileList.TILE_AIR) {
			if (x + 1 < mapWidth) {
				if (world[x + 1][y].getBrightness() > t.getBrightness()) {
					world[x + 1][y].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (x - 1 > 0) {
				if (world[x - 1][y].getBrightness() > t.getBrightness()) {
					world[x - 1][y].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (y - 1 > 0) {
				if (world[x][y - 1].getBrightness() > t.getBrightness()) {
					world[x][y - 1].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (y + 1 < mapHeight) {
				if (world[x][y + 1].getBrightness() > t.getBrightness()) {
					world[x][y + 1].setBrightness(t.getBrightness() + amount);
				}
			}
		} else if (t.getType() == TileList.TILE_SOLID) {
			if (x + 1 < mapWidth && world[x + 1][y].getType() == TileList.TILE_SOLID) {
				if (world[x + 1][y].getBrightness() > t.getBrightness()) {
					world[x + 1][y].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (x - 1 > 0 && world[x - 1][y].getType() == TileList.TILE_SOLID) {
				if (world[x - 1][y].getBrightness() > t.getBrightness()) {
					world[x - 1][y].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (y - 1 > 0 && world[x][y - 1].getType() == TileList.TILE_SOLID) {
				if (world[x][y - 1].getBrightness() > t.getBrightness()) {
					world[x][y - 1].setBrightness(t.getBrightness() + amount);
				}
			}
			
			if (y + 1 < mapHeight && world[x][y + 1].getType() == TileList.TILE_SOLID) {
				if (world[x][y + 1].getBrightness() > t.getBrightness()) {
					world[x][y + 1].setBrightness(t.getBrightness() + amount);
				}
			}
		}
		
	}
	
	// returns true or false based on if the co-ordinates given will be inside
	// of the area of the world thats covered by the screen
	public boolean checkRender(double x,double y) {
		boolean b = false;
		if (x > -this.x && x < (-this.x + Toolkit.getDefaultToolkit().getScreenSize().getWidth())) {
			if (y > -this.y && y < (-this.y + Toolkit.getDefaultToolkit().getScreenSize().getHeight())) {
				b = true;
			}
		}
		
		return b;
	}
	
	// getters / setters
	public Tile getTile(int x,int y) { if (x > -1 && x < mapWidth) { return world[x][y];} else {return new Stone();}}
	public Tile getTile(double x,double y) { return world[(int) ( x / tileSize)][(int) ( y / tileSize)];}
	public int getTileSize() { return tileSize;}
	public int getMapWidth() { return mapWidth;}
	public int getMapHeight() { return mapHeight;}
	public int getScreenWidth() { return screenWidth;}
	public int getScreenHeight() { return screenHeight;}
	public double getX() { return x;}
	public double getY() { return y;}
	public double getGravity() { return gravity;}
	public double getMaxGravity() { return maxGravity;}
	public boolean getAA() { return AA;}
	public boolean getLighting() { return lighting;}
	public boolean getFirst() { return first;}
	public ArrayList<Entity> getEntities() { return entities;}
	public ArrayList<ParticleEmitter> getParticleEmitters() { return emitters;}
	public ParticleEmitter getWeatherEmitter() { return weatherEmitter;}
	public Entity getRenderTarget() { return renderTarget;}
	public Sprites getTileTextures() { return tileTextures;}
	public void setTime(boolean b) { this.day = b;}
	public void setBGColor(Color c) { this.BGColor = c;}
	public void setFGColor(Color c) { this.FGColor = c;}
	public void setGravity(double d) { this.gravity = d;}
	public void setMaxGravity(double d) { this.maxGravity = d;}
	public void setX(double x) { this.x = x;}
	public void setY(double y) { this.y = y;}
	public void addX(double x) { this.x += x;}
	public void addY(double y) { this.y += y;}
	public void addEntity(Entity e) { this.entities.add(e);}
	public void addEmitter(ParticleEmitter pe) {this.emitters.add(pe);}
	public void setRenderTarget(Entity e) {this.renderTarget = e;}
	public void setAntiAliasing(boolean b) { this.AA = b;}
	public void setLighting(boolean b) {this.lighting = b;}
	public void setTile(int x,int y,Tile t) {world[x][y] = t;}
	public void setScriptHighlight(boolean b) { this.highlightScripts = b;}
	public void setWeather(boolean b) { this.weather = b;}
	public void removeEntity (Entity e) {
		if (entities.contains(e)) {
			entities.remove(entities.indexOf(e));
		} else if (emitters.contains(e)) {
			emitters.remove(emitters.indexOf(e));
		}
	}
	public void addOffset(double x,double y) {
		this.x += x;
		this.y += y;
	}
	public void setWeatherType(int i) {
		switch(i) {
		case ParticleEmitter.RAIN:
			weatherEmitter = new ParticleEmitter( (int) (mapWidth * tileSize),(int) (100),1,new Color(0,125,255),i,20000);
			break;
		case ParticleEmitter.SNOW:
			weatherEmitter = new ParticleEmitter( (int) (mapWidth * tileSize),(int) (100),1,new Color(255,255,255),i,2000);
			break;
		}
	}
	
	// returns all entities that are present on the screen
	public Entity[] getDrawnEntities() {
		ArrayList<Entity> el = new <Entity>ArrayList(10);
		int count = 0;
		for (int i = 0 ; i < entities.size() ; i++) {
			Entity e = entities.get(i);
			if (checkRender(e.getX(),e.getY())) {
				el.add(e);
				count++;
			}
		}
		Entity[] de = new Entity[count];
		for (int i = 0 ; i < count ; i++) {
			de[i] = el.get(i);
		}
		return de;
	}
	
	// returns the entity with the same reference name as the argument given
	public Entity getEntityReference(String s) {
		Entity e = null;
		
		for (int i = 0 ; i < entities.size() ; i++) {
			if (entities.get(i).getReference().equals(s)) {
				e = entities.get(i);
			}
		}
		
		return e;
	}
	
	// returns a 2D array of tiles from a defined region
	// x1, y1 is the top left selection
	// x2, y2 is the bottom right selection
	public Tile[][] getTileRegion(double x1,double y1,double x2,double y2) {
		
		int xMin = (int) (x1 / tileSize);
		int xMax = (int) (x2 / tileSize);
		int yMin = (int) (y1 / tileSize);
		int yMax = (int) (y2 / tileSize);
		Tile[][] region = new Tile[xMax - xMin][yMax - yMin];
		for (int x = xMin ; x < xMax ; x++) {
			for (int y = yMin ; y < yMax ; y++) {
				region[x - xMin][y - yMin] = world[x][y];
			}
		}
		
		return region;
	}
	
	// saving the current level to a file
	// it can overwrite but must have the .codex extension
	public void save(String s) {
		try {
			if (input.Script.getScriptFile(s) == null) {
				// if this level has no matching script file then a blank one is created
				File f = new File("resource/script/" + s);
				f.mkdirs(); 
				f.createNewFile();
			}
			BufferedWriter bw = new BufferedWriter(new FileWriter("resource/"+s));
			bw.write(mapWidth + "\n");
			bw.write(mapHeight + "\n");
			// Tile Data
			for (int y = 0 ; y < mapHeight ; y++) {
				String line = "";
				for (int x = 0 ; x < mapWidth ; x++) {
					Tile t = world[x][y];
					line += t.getID()[0];
					line += t.getID()[1];
					line += t.getType();
					line += t.getFunction();
					line += " ";
				}
				bw.write(line + "\n");
			}
			
			
			// Entity Data
			bw.write(entities.size() + "\n");
			for (int i = 0 ; i < entities.size(); i++) {
				Entity e = entities.get(i);
				String line = "";
				line += EntityList.getID(e) + " ";
				line += (int) (e.getX() / tileSize) + " ";
				line += (int) (e.getY() / tileSize);
				if (!e.getReference().equals("")) {line += " " + e.getReference();}
				if (!line.equals("") && !line.equals("null")) {bw.write(line + "\n");}
			}
		
		// Script Data
		int count = 0;
		String[] paths = new String[50];
		for (int x = 0 ; x < mapWidth ; x++) {
			for (int y = 0 ; y < mapHeight ; y++) {
				if (!world[x][y].getScript().equals("")) {
					paths[count] = x + " " + y + " " + world[x][y].getScript();
					count++;
				}
			}
		}
		bw.write(count + "\n");
		for (int i = 0 ; i < count ; i++) {
			bw.write(paths[i] + "\n");
		}
		
		if (background != null) {
			bw.write(backgroundSRC);
		}
		
		bw.close();
		} catch(Exception e) {}
		for (int y1 = 0 ; y1 < mapHeight ; y1++) {
			String line = "";
			for (int x1 = 0 ; x1 < mapWidth ; x1++) {
				Tile t = world[x1][y1];
				line += " " + t.getID()[0] + t.getID()[1] + t.getType() + t.getFunction();
			}
		}
		
	}
	
}
