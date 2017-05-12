package input.editor.tool;

import input.editor.CollisionBox;
import input.editor.TileAttributes;

import java.awt.Graphics;
import java.awt.Color;

import entity.particle.ParticleEmitter;
import level.tile.*;
import textures.Sprites;
import level.tile.TileList;
import input.Event;

public class TileSelect extends Tool {

	private static Tile selectedTile = new Stone();
	private boolean isSelecting;
	private CollisionBox attributes;
	private CollisionBox[][] tiles;
	public TileSelect() {
		Sprites tileTextures = input.Event.getCurrentLevel().getTileTextures();
		int tileSize = input.Event.getCurrentLevel().getTileSize();
		isSelecting = true;
		attributes = new CollisionBox(150,395,276,50,"attributes");
		tiles = new CollisionBox[4][4];
		for (int x = 0 ; x < 4 ; x++) {
			for (int y = 0 ; y < 4 ; y++) {
				tiles[x][y] = new CollisionBox(160 + x * tileSize,130 + y * tileSize,tileTextures.getFrame(y,x));
			}
		}
	}
	
	public void leftClickEvent() {
		if (isSelecting) {
			CollisionBox mouse = input.Event.getMouse();
			for (int x = 0 ; x < 4 ; x++) {
				for (int y = 0 ; y < 4 ; y++) {
					if (mouse.isTouching(tiles[x][y])) {
						if (y != 3) {
							selectedTile = TileList.getTile(y,x,TileList.TILE_SOLID,0,0,0);
						} else {
							selectedTile = new Tile();
							selectedTile.setAmount(4 - x);
						}
					}
				}
			}
			
			if (mouse.isTouching(attributes)) {
				new TileAttributes(selectedTile);
			}
			
			isSelecting = false;
		} else {
			double x = Event.getMouse().getX() - Event.getCurrentLevel().getX();
			double y = Event.getMouse().getY() - Event.getCurrentLevel().getY();
			int tileSize = Event.getCurrentLevel().getTileSize();
			Event.getCurrentLevel().setTile((int) (x / tileSize),(int) (y / tileSize),getSelectedTileInstance());
			if (selectedTile.getClass() == Torch.class) {
				Event.getCurrentLevel().addEmitter(new ParticleEmitter((int) (x / tileSize) * tileSize + 31,(int) (y / tileSize) * tileSize + 25,50,new Color(250,200,0),ParticleEmitter.FIRE,100));
			}
		}
	}
	
	public void rightClickEvent() {
		double x = Event.getMouse().getX() - Event.getCurrentLevel().getX();
		double y = Event.getMouse().getY() - Event.getCurrentLevel().getY();
		int tileSize = Event.getCurrentLevel().getTileSize();
		Event.getCurrentLevel().setTile((int) (x / tileSize),(int) (y / tileSize),new Tile());
	}
	
	public void keyEvent(char key) {
		
	}
	
	public void moveEvent() {
		
	}
	
	public void render(Graphics g) {
		if (isSelecting) {
			g.setColor(Color.CYAN);
			g.fillRect(150,120,276,276);
			g.setColor(Color.BLACK);
			g.fillRect(160,130,256,256);
			attributes.render(g);
			for (int x = 0 ; x < 4 ; x++) {
				for (int y = 0 ; y < 4 ; y++) {
					tiles[x][y].render(g);
				}
			}
		}
	}
	
	public static Tile getSelectedTile() { return selectedTile;}
	
	public static Tile getSelectedTileInstance() {
		Tile tile = null;
		try {
			tile = selectedTile.getClass().newInstance();
			tile.setAmount(selectedTile.getAmount());
			tile.setFunction(selectedTile.getFunction());
			tile.setType(selectedTile.getType());
			tile.setScript(selectedTile.getScript());
		} catch (InstantiationException | IllegalAccessException e) {}
	
		return tile;
	}
	
}
