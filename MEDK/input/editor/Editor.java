package input.editor;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.util.ArrayList;

import textures.Sprites;
import level.Level;
import input.Console;
import input.Event;
import input.editor.tool.*;

public class Editor {
	
	private static ArrayList<CollisionBox> buttons = new ArrayList<CollisionBox>(10);
	// a dynamically sizing array that contains all of the editor's UI components
	private static Dimension screenSize = java.awt.Toolkit.getDefaultToolkit().getScreenSize();
	private static Tool currentTool = new Tool();
	// a Tool object reference used to call events of the currently selected tool
	private static CollisionBox currentButton;
	private static CollisionBox select;
	private static CollisionBox in_edit;
	private static CollisionBox out_edit;
	private static CollisionBox fill;
	private static CollisionBox selectTile;
	private static CollisionBox selectEntity;
	private static CollisionBox script_editor;
	// UI components of the editor
	
	private Editor() {
		// setup editor UI
		// called by main constructor
		Sprites buttonTextures = new Sprites("resource/editorButtons.png",100,100);
		int width = (int) java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth();
		select = new CollisionBox(10,10,buttonTextures.getFrame(0,0));
		fill = new CollisionBox(120,10,buttonTextures.getFrame(1,0));
		selectTile = new CollisionBox(230,10,buttonTextures.getFrame(2,0));
		selectEntity = new CollisionBox(340,10,buttonTextures.getFrame(3,0));
		script_editor = new CollisionBox(450,10,buttonTextures.getFrame(4,0));
		buttonTextures = new Sprites("resource/modeButtons.png",100,300);
		in_edit = new CollisionBox(width - 450,10,buttonTextures.getFrame(0,0));
		out_edit = new CollisionBox(width - 450,10,buttonTextures.getFrame(1,0));
		
		add(select);
		add(out_edit);
		add(fill);
		add(selectTile);
		add(selectEntity);
		add(script_editor);
	}
	
	public static void leftClickEvent()  {
		CollisionBox cb = null;
		if (Console.getState()) {
			// only runs these checks if the engine is in editor mode
			for (int i = 0 ; i < buttons.size() ; i++) {
				if (Event.getMouse().isTouching(buttons.get(i))) {
					cb = buttons.get(i);
					if (cb != out_edit && cb != fill) { currentButton = cb;}
					// each button is checked with the mouse collision box
					// (which is another collision box that is 10x10px big and follows the mouse on the screen)
					// if any of the editor buttons do collide with the mouse after a left click
					// then it becomes reference by the currentButton variable
				}
			}

			if (cb == null) {
				currentTool.leftClickEvent();
				// calling the event of the current tool if no buttons where clicked on
			}
		// events in editor mode
			if (cb == select) {
				currentTool = new Select();
			}
			
			if (cb == out_edit) {
				// gets out of editor mode
				Console.setState(false);
			}
			
			if (cb == fill) {
				// fills the area picked with the select tool with the last tile chosen in the tile select
					int[] region = Select.getSelectedRegion();
					for (int x = region[0] ; x < region[1] ; x++) {
						for (int y = region[2] ; y < region[3] ; y++) {
							Event.getCurrentLevel().setTile(x,y,TileSelect.getSelectedTileInstance());
						}
					}
			}
			
			if (cb == selectTile) {
				currentTool = new TileSelect();
			}
			
			if (cb == selectEntity) {
				currentTool = new EntitySelect();
			}
			
			if (cb == script_editor) {
				new ScriptEditor();
			}
			
		} else {
			// events out of editor mode
			CollisionBox mouse = Event.getMouse();
			if (mouse.isTouching(in_edit)) {
				Console.setState(true);
			}
		}
	}
	
	public static void rightClickEvent() {
		CollisionBox cb = null;
		if (Console.getState()) {
			for (int i = 0 ; i < buttons.size() ; i++) {
				if (Event.getMouse().isTouching(buttons.get(i))) {
					cb = buttons.get(i);
				}
			}
			
			if (cb == null) {
				// running the right click event of the current tool if no buttons where clicked on
				currentTool.rightClickEvent();
			}
			
		}
	}
	
	public static void moveEvent() {
		currentTool.moveEvent();
		// calling the mousemovement event of the current tool
	}
	
	public static void keyEvent(char key) {
		if (currentTool != null) { currentTool.keyEvent(key);}
		// calling the key event of the current tool
		
		// panning the screen with the WASD keys
		switch(key) {
		case 'w':
			Event.getCurrentLevel().addOffset(0,10);
			break;
		case 's':
			Event.getCurrentLevel().addOffset(0,-10);
			break;
		case 'a':
			Event.getCurrentLevel().addOffset(10,0);
			break;
		case 'd':
			Event.getCurrentLevel().addOffset(-10,0);
			break;
		}
	}
	
	public static void tick() {
		CollisionBox mouse = Event.getMouse();
		Level level = Event.getCurrentLevel();
		
		// if the mouse is at any edge of the window then it pans in that direction
		// y axis
		if (mouse.getY() < 50) {
			level.addOffset(0,10);
		} else if (mouse.getY() > screenSize.getHeight() - 50) {
			level.addOffset(0,-10);
		}
		
		// x axis
		if (mouse.getX() < 50) {
			level.addOffset(10,0);
		} else if (mouse.getX() > screenSize.getWidth() - 50) {
			level.addOffset(-10,0);
		}
	}
	
	public static void render(Graphics g) {
		// draws the current tool and the editor UI if in editor mode
		// if not then it draws the button to go into editor mode
		for (int i = 0 ; i < buttons.size() ; i++) {
			if (Console.getState()) {
				buttons.get(i).render(g);
				currentTool.render(g);
			} else {
				in_edit.render(g);
			}
		}
		
		if (currentButton != null && Console.getState()) {
			// if in editor mode then the last button clicked on has a thick red border drawn around it
			Graphics2D g2d = (Graphics2D) g;
			g2d.setStroke(new BasicStroke(5));
			g2d.setColor(Color.RED);
			g2d.drawRect((int) currentButton.getX(),(int) currentButton.getY(),currentButton.getWidth(),currentButton.getHeight());
		}
		
	}
	
	public static Editor getInstance() { return new Editor();}
	
	public static void add(CollisionBox cb) {
		buttons.add(cb);
	}
	
}
