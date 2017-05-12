package input.editor.tool;

import input.editor.CollisionBox;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Image;
import javax.swing.ImageIcon;

import level.Level;

import entity.*;

public class EntitySelect extends Tool {

	private static Image icons = new ImageIcon("resource/entitySelect.png").getImage();
	private static int xStart = 340;
	private static int yStart = 110;
	private boolean clicked;
	private Entity selectedEntity;
	private CollisionBox[] buttons;
	
	public EntitySelect() {
		buttons = new CollisionBox[5];
		buttons[0] = new CollisionBox(xStart,yStart,55,55,"Human");
		buttons[1] = new CollisionBox(xStart + 60,yStart,55,55,"Enemy");
		buttons[2] = new CollisionBox(xStart + 120,yStart,55,55,"TNT");
		buttons[3] = new CollisionBox(xStart,yStart + 60,55,55,"Light");
		buttons[4] = new CollisionBox(xStart + 60,yStart + 60,55,55,"Black Hole");
	}
	
	public void leftClickEvent() {
		CollisionBox mouse = input.Event.getMouse();
		Level l = input.Event.getCurrentLevel();
		if (!clicked) {
			int b = -1;
			for (int i = 0 ; i < 5 ; i++) {
				if (mouse.isTouching(buttons[i])) {
					b = i;
				}
			}
			switch(b) {
			case 0:
				selectedEntity = new Human();
				break;
			case 1:
				selectedEntity = new BaseEnemy();
				break;
			case 2:
				selectedEntity = new TNT();
				break;
			case 3:
				selectedEntity = new Light();
				break;
			case 4:
				selectedEntity = new BlackHole();
				break;
			}
			clicked = true;
		} else {
			Entity e = getEntityInstance();
			e.setPos(mouse.getX() - l.getX(),mouse.getY() - l.getY());
			l.addEntity(e);
		}
	}
	
	public void render(Graphics g) {
		if (!clicked) {
			g.drawImage(icons,xStart,yStart,null);
			CollisionBox mouse = input.Event.getMouse();
			for (int i = 0 ; i < 5 ; i++) {
				if (mouse.isTouching(buttons[i])) {
					g.setColor(Color.BLACK);
					g.drawString(buttons[i].getName(),(int) mouse.getX(),(int) mouse.getY());
				}
			}
		}
	}
	
	public Entity getEntityInstance() {
		Entity e = new Entity();	
		try {
			e = selectedEntity.getClass().newInstance();
		} catch (InstantiationException | IllegalAccessException ex) {System.out.println(ex.getMessage());}
		
		return e;
	}
	
}
