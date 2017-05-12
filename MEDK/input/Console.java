package input;

import input.editor.CollisionBox;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;

import textures.Sprites;

import entity.Entity;

public class Console {
	
	private static ArrayList <Script> scripts = new ArrayList<Script>(10);
	private static ArrayList <CalledScript> triggeredScripts = new ArrayList<CalledScript>(10);
	private static ArrayList <String> commandLog = new ArrayList<String>(10);
	private static ArrayList <String> testNames = new ArrayList<String>(10);
	private static String lastCalledScript = "";
	private static CollisionBox newLevel;
	private static CollisionBox loadLevel;
	private static CollisionBox options = new CollisionBox(java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth() / 2 - 250,500,500,100,"Options");
	private static boolean isRunning;
	private static boolean state = false;
	private static boolean logEnabled = true;
	private static boolean first = true;
	private static boolean end = false;
	private static double width = 0 , height = 0;
	private static int FPS_LIMIT = 120;
	private static int TICKS_PER_SECOND = 60;
	private static long FRAME_WAIT_TIME = 1000000000 / Console.getFPSLimit();
	private static int SKIP_TICKS = 1000 / Console.getTickLimit();
	
	public Console() {
		Sprites buttonTextures = new Sprites("resource/mainButtons.png",100,500);
		newLevel = new CollisionBox(java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth() / 2 - 250,300,buttonTextures.getFrame(0,0));
		loadLevel = new CollisionBox(java.awt.Toolkit.getDefaultToolkit().getScreenSize().getWidth() / 2 - 250,450,buttonTextures.getFrame(1,0));
	}
	
	public static void tick() {
		// updating all of the active scripts
		// each tick would run one line of code
			for (int i = 0 ; i < scripts.size() ; i++) {
				if (scripts.get(i).tick()) {
					scripts.remove(i);
				}
			}
			
			// when a script is added to the console it also adds a "triggered script" of the same type
			// this prevents the same script from being added over and over
			for (int i = 0 ; i < triggeredScripts.size() ; i++) {
				if (System.currentTimeMillis() - triggeredScripts.get(i).getCast() > 100) {
					triggeredScripts.remove(i);
				}
			}
	}
	
	public static void command(String s,Entity activator) {
		// interpreter for each script command
		commandLog.add(s);
		if (commandLog.size() == 10) {
			commandLog.remove(0);
		}
		
		try {
			String[] tokens = s.toLowerCase().split(" ");
			String args = "";
			Method m = Command.getCommand(tokens[1]);
			for (int i = 2 ; i < tokens.length ; i++) {
				if (i == 2) {
					args += tokens[i];
				} else {
					args += " " + tokens[i];
				}
				
			}
			if (tokens[0].equals("level") || tokens[0].equals("console")) {
				m.invoke(null,args);
			} else if (activator != null && Event.getCurrentLevel().getEntityReference(tokens[0]) == null) {
				m.invoke(null,activator,args);
			} else {
				m.invoke(null,Event.getCurrentLevel().getEntityReference(tokens[0]),args);
			}
			
		} catch (SecurityException | IllegalArgumentException | IllegalAccessException | InvocationTargetException ex) {}
	
	}
	
	public static boolean testCommand(String s) {
		boolean sucessful = true;
		String[] tokens = s.toLowerCase().split(" ");
		String args = "";
		try {Method m = Command.getCommand(tokens[1]);} catch(Exception e) {sucessful = false;}
		for (int i = 2 ; i < tokens.length ; i++) {
			if (i == 2) {
				args += tokens[i];
			} else {
				args += " " + tokens[i];
			}
			
		}
		String[] arg = args.split(" ");
		if (arg.length == 4) {
			testNames.add(arg[3]);
		}
		
		if (!tokens[0].equals("level") && !tokens[0].equals("console")) {
			if (Event.getCurrentLevel().getEntityReference(tokens[0]) == null) {
				for (int i = 0 ; i < testNames.size() ; i++) {
					if (tokens[0].equals(testNames.get(i))) {
						sucessful = false;
					}
				}
			}
		}
		
		return sucessful;
	}
	
	public static void addScript(String s,Entity activator) {
		boolean triggered = false;
		for (int i = 0 ; i < triggeredScripts.size(); i++) {
			if (triggeredScripts.get(i).getScript().equals(s)) {
				triggered = true;
				triggeredScripts.get(i).setCast(System.currentTimeMillis());
			}
		}

		if (!triggered) {
			scripts.add(new Script(s));
			triggeredScripts.add(new CalledScript(s,activator));
		}
		
		lastCalledScript = s;
		
	}
	
	public static Entity getScriptActivator(String s) {
		Entity e = null;
		
		for (int i = 0 ; i < triggeredScripts.size() ; i++) {
			if (triggeredScripts.get(i).getScript().equals(s)) {
				e = triggeredScripts.get(i).getActivator();
			}
		}
		
		return e;
	}
	
	public static void setFPSLimit(int i) { 
		FPS_LIMIT = i;
		FRAME_WAIT_TIME = 1000000000 / Console.getFPSLimit();
	}
	public static void setTickLimit(int i) {
		TICKS_PER_SECOND = i;
		SKIP_TICKS = 1000 / Console.getTickLimit();
	}
	
	public static void render(Graphics g) {
		g.setColor(Color.WHITE);
		if (logEnabled) {
			for (int i = 0 ; i < commandLog.size(); i++) {
				g.drawString(commandLog.get(i),50, 100 + i * 20);
			}
		}
		
		if (first) {
			newLevel.render(g);
			loadLevel.render(g);
			//options.render(g);
		}
		
		if (end) {
			g.setColor(Color.RED);
			width += 5;
			height += 5;
			Dimension size = java.awt.Toolkit.getDefaultToolkit().getScreenSize();
			g.fillOval((int) (size.getWidth() / 2 - (width / 2)),(int) (size.getHeight() / 2 - (height / 2)),(int) width,(int) height);
			if (width > size.getWidth() + 400 && height > size.getHeight() + 400) {
				System.exit(0);
			}
		}
	}
	
	public static void end() { end = true;}
	
	public static void loadLevel(String s) {
		
	}
	public static CollisionBox[] getButtons() {
		CollisionBox[] buttons = new CollisionBox[2];
		buttons[0] = newLevel;
		buttons[1] = loadLevel;
		//buttons[2] = options;
		return buttons;
	}
	public static void setState(boolean b) {state = b;}
	public static void setLog(boolean b) {logEnabled = b;}
	public static int getFPSLimit() { return FPS_LIMIT;}
	public static int getTickLimit() { return TICKS_PER_SECOND;}
	public static long getSkipTicks() { return SKIP_TICKS;}
	public static long getFrameWaitTime() { return FRAME_WAIT_TIME;}
	public static boolean getState() { return state;}
	public static boolean getLogEnabled() { return logEnabled;}
	public static boolean getFirst() { return first;}
	public static void calledFirst() { 
		first = false;
		Console.setLog(true);
		commandLog = new ArrayList<String>(10);
		audio.SoundPlayer.playMusic("null");
	}
	public static Console getInstance() { return new Console();}
	public static boolean getIsRunning() { return isRunning;}
	public static void setIsRunning(boolean b) { isRunning = b;}
}
