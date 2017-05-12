package input;
import input.editor.CollisionBox;

import java.applet.Applet;
import java.awt.Color;
import java.awt.GraphicsDevice;
import java.awt.Rectangle;
import java.awt.event.MouseEvent;
import java.awt.event.KeyEvent;
import java.awt.event.MouseAdapter;
import java.awt.event.KeyListener;
import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.filechooser.FileNameExtensionFilter;

import level.Level;
import level.tile.Dirt;
import entity.*;
import entity.particle.ParticleEmitter;

public class Event extends MouseAdapter implements KeyListener {

	private static Entity player;
	private static Entity player2;
	private static Level level;
	private static JFrame frame;
	private static GraphicsDevice gd;
	private static boolean mode = true;
	private static Applet main;
	
	private Event() {}
	private static CollisionBox mouse = new CollisionBox(0,0,10,10,null);
	private static Entity mouseEntity = new Entity(null,0,0,20,20);
	private static boolean leftClick;
	private static boolean rightClick;
	public static void setPlayer(Entity e) { player = e;}
	public static void setSecondPlayer(Entity e) { player2 = e;}
	public static void setLevel(Level l) { level = l;}
	public static Entity getCurrentPlayer() { return player;}
	public static Level getCurrentLevel() { return level;}
	public static Event getInstance() { return new Event();}
	
	public void keyPressed(KeyEvent e) {
		char key = e.getKeyChar();
		if (Console.getState()) { input.editor.Editor.keyEvent(key);}
		switch(key) {
		case 'w':
			player.setJumping(true);
			break;
		case ' ':
			player.setJumping(true);
			break;
		case 'a':
			player.setLeft(true);
			break;
		case 'd':
			player.setRight(true);
			break;
		case 'x':
			player.action();
			break;
		case 'o':
			level.setAntiAliasing(!level.getAA());
			break;
		case 'l':
			level.addEntity(entity.EntityList.getEntity(1,100,100));
			break;
		case 'p':
			player.kill();
			break;
		case '[':
			TNT t = new TNT();
			t.setPos(player.getX(),player.getY() - 50);
			t.kill();
			level.addEntity(t);
			break;
		case ']':
			level.getTile((int) (player.getX() / level.getTileSize()),(int) (player.getY() / level.getTileSize())).setAmount(4);
			break;
		case ';':
			Console.command(javax.swing.JOptionPane.showInputDialog(""),null);
		break;
		case 'i':
			level.setLighting(!level.getLighting());
			break;
		case '8':
			player2.setJumping(true);
			break;
		case '4':
			player2.setLeft(true);
			break;
		case '6':
			player2.setRight(true);
			break;
		}
		
		if (e.getKeyCode() == KeyEvent.VK_F11) {
			try {
				if (mode) {
					Class main = Class.forName("Main");
					Method window = main.getMethod("fullScreen");
					window.invoke(null);
					mode = false;
				} else {
					Class main = Class.forName("Main");
					Method window = main.getMethod("window");
					window.invoke(null);
					mode = true;
				}
			} catch (NoSuchMethodException|SecurityException|ClassNotFoundException | IllegalAccessException | IllegalArgumentException | InvocationTargetException e1) {e1.printStackTrace();}
		}
		
	}
	
	public void keyReleased(KeyEvent e) {
		char key = e.getKeyChar();
		switch(key) {
		case 'a':
			player.setLeft(false);
			break;
		case 'd':
			player.setRight(false);
			break;
		case '4':
			player2.setLeft(false);
			break;
		case '6':
			player2.setRight(false);
			break;
		}
	}
	
	public void mousePressed(MouseEvent e) {
		if (e.getButton() == MouseEvent.BUTTON1) {
			input.editor.Editor.leftClickEvent();
		} else if(e.getButton() == MouseEvent.BUTTON3) {
			input.editor.Editor.rightClickEvent();
		}
		
		if (Console.getFirst()) {
			CollisionBox[] buttons = Console.getButtons();
			
			if (mouse.isTouching(buttons[0])) {
				int width = Integer.parseInt(JOptionPane.showInputDialog("Map Width"));
				int height = Integer.parseInt(JOptionPane.showInputDialog("Map Height"));
				if (JOptionPane.showConfirmDialog(null,"Terrain Generation?","", JOptionPane.YES_NO_OPTION) == JOptionPane.YES_OPTION) {
					new Level(width,height,true,64);
				} else {
					new Level(width,height,false,64);
				}
				
				Console.calledFirst();
			} else if (mouse.isTouching(buttons[1])) {
				javax.swing.JFileChooser choice = new javax.swing.JFileChooser(new File("resource"));
				FileNameExtensionFilter codexFilter = new FileNameExtensionFilter("codex files (*.codex)", "codex");
				choice = new JFileChooser(new File("resource"));
				choice.setFileFilter(codexFilter);
				choice.showDialog(null,"Open");
				new Level("resource/"+choice.getSelectedFile().getName(),64);
				Console.calledFirst();
			//} else if (mouse.isTouching(buttons[2])) {
			//	Console.end();
			}
		}
	}
	
	public void mouseMoved(MouseEvent e) {
		mouse.setX(e.getX());
		mouse.setY(e.getY());
		mouseEntity.setPos(e.getX() - level.getX(),e.getY() - level.getY());
		if (Console.getState()) {input.editor.Editor.moveEvent();}
	}
	
	public static CollisionBox getMouse() { return mouse;}
	public static Entity getMouseEntity() { return mouseEntity;}
	public static JFrame getFrame() { return frame;}
	public static void init(GraphicsDevice graphicsDevice,Applet m) {
		frame = new JFrame();
		gd = graphicsDevice;
		main = m;
	}
	
public void keyTyped(KeyEvent e) {}
}
