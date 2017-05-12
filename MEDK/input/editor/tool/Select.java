package input.editor.tool;

import input.Event;
import input.editor.CollisionBox;

import java.awt.Color;
import java.awt.Graphics;
import java.util.ArrayList;

import level.Level;
import level.tile.Tile;
import entity.Entity;
import entity.particle.ParticleEmitter;

public class Select extends Tool {

	private static Entity selectedEntity;
	private boolean isSelectingRegion = false;
	private double x1,y1,x2,y2;
	private static int xMin,xMax,yMin,yMax;
	
	public Select() {
	
	}
	
	public void leftClickEvent() {
		boolean hasSelected = false;
		Entity mouse = Event.getMouseEntity();
		Entity[] entities = Event.getCurrentLevel().getDrawnEntities();
		for (int i = 0 ; i < entities.length ; i++) {
			if (entities[i].isTouching(mouse)) {
				if (entities[i] != selectedEntity) {
					selectedEntity = entities[i];
					hasSelected = true;
				} else {
					hasSelected = false;
				}
			}
		}
		ArrayList<ParticleEmitter> emitters = Event.getCurrentLevel().getParticleEmitters();
		for (int i = 0 ; i  < emitters.size() ; i++) {
			if (emitters.get(i).isTouching(Event.getMouseEntity())) {
				if (emitters.get(i) != selectedEntity) {
					selectedEntity = emitters.get(i);
					hasSelected = true;
				} else {
					hasSelected = false;
				}
			}
		}
		if (!hasSelected) { selectedEntity = null;}
	}
	
	public void rightClickEvent() {
		Level l = Event.getCurrentLevel();
		if (!isSelectingRegion) {
			x1 = Event.getMouse().getX() - Event.getCurrentLevel().getX();
			y1 = Event.getMouse().getY() - Event.getCurrentLevel().getY();
			isSelectingRegion = true;
		} else {
			x2 = Event.getMouse().getX() - Event.getCurrentLevel().getX();
			y2 = Event.getMouse().getY() - Event.getCurrentLevel().getY();
			xMin = (int) (x1 / l.getTileSize());
			xMax = (int) (x2 / l.getTileSize());
			yMin = (int) (y1 / l.getTileSize());
			yMax = (int) (y2 / l.getTileSize());
			isSelectingRegion = false;
		}
	}
	
	public void moveEvent() {
		if (selectedEntity != null) {
			CollisionBox mouse = Event.getMouse();
			selectedEntity.setPos(mouse.getX() - Event.getCurrentLevel().getX(),mouse.getY() - Event.getCurrentLevel().getY());
		}
	}
	
	public void keyEvent(char key) {
		switch(key) {
		case '\u007F':
			Event.getCurrentLevel().removeEntity(selectedEntity);
			for (int x = xMin ; x < xMax ; x++) {
				for (int y = yMin ; y < yMax ; y++) {
					Event.getCurrentLevel().setTile(x,y,new Tile());
				}
			}
			xMin = 0;
			xMax = 0;
			yMin = 0;
			yMax = 0;
			selectedEntity = null;
			break;
		case '\u001B':
			xMin = 0;
			xMax = 0;
			yMin = 0;
			yMax = 0;
			selectedEntity = null;
			isSelectingRegion = false;
			break;
		}
	}
	
	public void render(Graphics g) {
		Level l = Event.getCurrentLevel();
		if (selectedEntity != null) {
			g.setColor(Color.RED);
			Entity selectedEntity = (Entity) this.selectedEntity;
			g.drawRect((int) (Event.getCurrentLevel().getX() + selectedEntity.getX()) ,(int) (Event.getCurrentLevel().getY() + selectedEntity.getY()),selectedEntity.getWidth(),selectedEntity.getHeight());
			
		}
		
		if (isSelectingRegion) {
			CollisionBox mouse = Event.getMouse();
			g.setColor(Color.RED);
			if (xMin < xMax && yMin < yMax) {
				g.drawRect((int) (x1 + l.getX()),(int) (y1 + l.getY()),(int) (mouse.getX() - x1 - l.getX()),(int) (mouse.getY() - y1 - l.getY()));
			}
		} else {
			g.setColor(Color.RED);
			if (xMin < xMax && yMin < yMax) {
				for (int x = xMin ; x < xMax ; x++) {
					for (int y = yMin ; y < yMax ; y++) {
						g.drawRect((int) (x * l.getTileSize() + l.getX()),(int) (y * l.getTileSize() + l.getY()),l.getTileSize(),l.getTileSize());
					}
				}
			} else if (xMin > xMax && yMin < yMax) {
				for (int x = xMax ; x < xMin ; x++) {
					for (int y = yMin ; y < yMax ; y++) {
						g.drawRect((int) (x * l.getTileSize() + l.getX()),(int) (y * l.getTileSize() + l.getY()),l.getTileSize(),l.getTileSize());
					}
				}
			} else if (xMin < xMax && yMin > yMax) {
				for (int x = xMin ; x < xMax ; x++) {
					for (int y = yMax ; y < yMin ; y++) {
						g.drawRect((int) (x * l.getTileSize() + l.getX()),(int) (y * l.getTileSize() + l.getY()),l.getTileSize(),l.getTileSize());
					}
				}
			} else if (xMin > xMax && yMin > yMax) {
				for (int x = xMax ; x < xMin ; x++) {
					for (int y = yMax ; y < yMin ; y++) {
						g.drawRect((int) (x * l.getTileSize() + l.getX()),(int) (y * l.getTileSize() + l.getY()),l.getTileSize(),l.getTileSize());
					}
				}
			}
		}
	}
	
	public static Entity getSelectedEntity() { return selectedEntity;}
	public static int[] getSelectedRegion() {
		int[] region = new int[4];
		region[0] = xMin;
		region[1] = xMax;
		region[2] = yMin;
		region[3] = yMax;
		return region;
	}
	
}
