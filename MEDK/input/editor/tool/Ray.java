package input.editor.tool;

public class Ray {

	private double distance = 0;
	private boolean collided = false;
	private Vector finalPos = null;
	
	public Ray(Vector pos,Vector target,int step_) {
		double realDistance = Math.sqrt(Math.pow(target.getX() - pos.getX(),2) + Math.pow(target.getY() - pos.getY(),2));
		Vector oldPos = pos;
		Vector step = new Vector((target.getX() - pos.getX()), (target.getY() - pos.getY()) / distance);
		double stepDistance = Math.sqrt( Math.pow(step_,2) + Math.pow(step_,2));
		while(!collided  && distance < realDistance) {
			int x = (int) oldPos.getX() / input.Event.getCurrentLevel().getTileSize();
			int y = (int) oldPos.getY() / input.Event.getCurrentLevel().getTileSize();
			if (input.Event.getCurrentLevel().getTile(x,y).getType() == level.tile.TileList.TILE_SOLID) {
				collided = true;
				finalPos = oldPos;
			} else {
				oldPos = oldPos.add(step);
				distance += stepDistance;
			}
			
			if (distance > realDistance) {
				finalPos = oldPos;
			}
			System.out.println(step.getX()+","+realDistance);
		}
	}
	
	public Vector getPos() { return finalPos;}
	public double getDistance() { return distance;}
	public boolean getCollided() { System.out.println(collided); return collided;}
	
}
