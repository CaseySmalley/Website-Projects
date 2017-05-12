package level.tile;

import java.awt.Color;

import level.Level;
import entity.Entity;
import entity.Light;
import entity.particle.ParticleEmitter;

public class TileList {

	private TileList() {
		
	}
	
	// constant values used for collision logic
	public static final int TILE_AIR = 0;
	public static final int TILE_SOLID = 1;
	public static final int TILE_WATER = 2;
	
	// constant values used for AI logic
	public static final int AI_STOP = 1;
	public static final int AI_LEFT = 2;
	public static final int AI_RIGHT = 3;
	public static final int AI_JUMP = 4;
	
	
	public static Tile getTile(int x,int y,int type,int function,int rx,int ry) {
		// used to get a new tile depending on its ID
		// this is called by the level class's constructor with the tile ID being parsed through
		// e.g. "0110" 
		// the first two digits are the tile ID, the third digit is its collision type and the last is a tiles AI function
		Tile tile = new Tile();
		Level l = input.Event.getCurrentLevel();
		
		switch(x) {
		
		case 0:
			switch(y) {
			case 1:
				tile = new Stone();
				break;
			
			case 2:
				tile = new Dirt();
				break;
				
			case 3:
				tile = new Wood();
				break;
			}
			
			break;
			
		case 1:
			switch(y) {
			case 0:
				tile = new Torch();
				// if the requested tile is a torch and has air type collision
				// a fire emitter is spawned at where its flames should appear
				if (type == TileList.TILE_AIR) {l.addEmitter(new ParticleEmitter((int) (rx * l.getTileSize()) + 32,(int) (ry * l.getTileSize()) + 27,50,new Color(250,200,0),ParticleEmitter.FIRE,100));}
				break;
				
			case 1:
				tile = new Brick();
				break;
				
			case 2:
				tile = new Dirt_Grass();
				break;
				
			case 3:
				tile = new Log();
				break;
				
			}
			break;
			
		case 2:
			switch(y) {
			case 0:
				tile = new TNT();
				break;
				
			case 1:
				tile = new CobbleStone();
				break;
				
			case 2:
				tile = new Dirt_Snow();
				break;
				
			case 3:
				tile = new BookShelf();
				break;
			
			}
			break;
			
		case 3:
			tile.setAmount(y);
			break;
		
		}
		tile.setType(type);
		tile.setFunction(function);
		if (type == TILE_SOLID) {
			tile.setAlpha(1);
		} else if (type == TILE_AIR) {
			if (tile.getClass() != new Torch().getClass()) {
				tile.setAlpha(0.6);
			}
		}
		return tile;
		
	}
	
}
