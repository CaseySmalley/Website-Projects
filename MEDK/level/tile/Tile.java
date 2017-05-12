package level.tile;

public class Tile {
	
	// this is the base class for all tiles
	// they all inherit from this one
	
	protected int[] id = new int[2];
	// uniquely identifies all tiles and is also used to get the correct texture for a specified tile
	protected String script = "";
	// stores the filename of a script that is assigned to a tile
	protected boolean isScriptRunning = false;
	// used to time the script if it is being executed
	protected boolean snow;
	// if true the tile has a layer of snow rendered above it
	// this becomes true if a snow particle collides with a tile
	protected int type = 0;
	// set with a constant in the TileList class
	// diginifies the type of collision the tile has
	protected int function = 0;
	// set with a constant in the TileList class
	// controls what a BaseEnemy does when crossing this tile
	protected int amount = 0;
	// the water content of the tile (4 is the maximum)
	protected float brightness = 0;
	// the amount of light that is present at this tile (0 - 1F)
	protected double alpha = 1;
	// the alpha value at which the tile is rendered where 0 is transparant
	
	public void tick() {}
	public void setAmount(int i) { 
		// ajusts the amount of water in the tile
		// and modifies its collision type depending on how much water it has
		if (this.type != TileList.TILE_SOLID) {
			this.amount = i;
			if (amount < 0) { amount = 0;}
			if (amount > 5) { amount = 5;}
			if (this.amount > 0) {
				this.type = TileList.TILE_WATER;
			} else {
				this.type = TileList.TILE_AIR;
			}
		}
		
	}
	public void setType(int i) { this.type = i;}
	public void setFunction(int i) { this.function = i;}
	public void setAlpha(double d) { this.alpha = d;}
	public void setScript(String s) { this.script = s;}
	public void setIsScriptRunning(boolean b) { this.isScriptRunning = b;}
	public void setSnow(boolean b) { this.snow = b;}
	public void setBrightness(float f) { this.brightness = f;}
	
	public int[] getID() { return id;}
	public float getBrightness() { return brightness;}
	public int getAmount() { return amount;}
	public int getType() { return type;}
	public int getFunction() { return function;}
	public double getAlpha() { return alpha;}
	public String getScript() { return script;}
	public boolean isScriptRunning() { return isScriptRunning;}
	public boolean getSnow() { return snow;}
	
}
