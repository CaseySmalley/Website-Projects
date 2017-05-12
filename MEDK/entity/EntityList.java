package entity;

import level.Level;

public class EntityList {
	
	public static final int ENT_FREINDLY = 0;
	public static final int ENT_ENEMY = 1;
	
	private EntityList() {
		
	}
	
	public static Entity getEntity(int id,double x,double y) {
		Level l = input.Event.getCurrentLevel();
		Entity e = new Entity(l);
			
			switch(id) {
			case 1:
				e = new Human();
				e.setReference("player");
				input.Event.setPlayer(e);
				input.Event.getCurrentLevel().setRenderTarget(e);
				break;
			
			case 2:
				e = new BaseEnemy();
				break;
			case 3:
				e = new TNT();
				break;
			case 4:
				e = new Light();
				break;
				
			}
			e.setPos(x,y);
		return e;
	}
	
	public static int getID(Entity e) {
		int id = 0;
		String s = e.getClass().getSimpleName();
		if (s.equals("Human")) {
			id = 1;
		} else if (s.equals("BaseEnemy")) {
			id = 2;
		} else if(s.equals("TNT")) {
			id = 3;
		} else if(s.equals("Light")) {
			id = 4;
		}
		
		return id;
	}
	
}
