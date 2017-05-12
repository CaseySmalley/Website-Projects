import java.applet.Applet;
import java.awt.Dimension;
import java.awt.GraphicsDevice;
import java.awt.Toolkit;
import java.awt.Color;
import java.awt.Image;
import java.awt.Graphics2D;
import java.awt.image.VolatileImage;
import java.io.File;
import java.util.ArrayList;
import javax.swing.JFrame;
import level.*;
import input.*;
import input.editor.tool.Table;
// importing all needed libraries
public class Main extends Applet implements Runnable {
	
	private static String title = "Matrix Engine Development Kit";
	private Color background = new Color(135,206,250);
	private int width = (int) Toolkit.getDefaultToolkit().getScreenSize().getWidth();
	private int height = (int) Toolkit.getDefaultToolkit().getScreenSize().getHeight();
	private int MAX_FRAMESKIP = 10;
	private int loops;
	private long next_game_tick = System.currentTimeMillis();
	private int FPS;
	private int currentFPS;
	private int updates;
	private int currentUpdates;
	private long usedMemory;
	private long freeMemory;
	private long totalMemory;
	private long lastFPSCount;
	private long lastUpdateCount;
	private long lastFrame;
	private static boolean isSwitching;
	private VolatileImage screen;
	private static JFrame frame;
	private static GraphicsDevice graphicsDevice;
	private static Main MainInstance;
	double i = 0;
	
	public Main() {
		graphicsDevice = java.awt.GraphicsEnvironment.getLocalGraphicsEnvironment().getDefaultScreenDevice();
		// initializing all of the components of the engine
		textures.Sprites.init();
		input.Script.init();
		input.Event.init(graphicsDevice,this);
		new Table();
		new Console();
		String s = "resource/title.codex";
		// generating a random number to decide what level will be used on the title screen
		int r = (int) (Math.random() * 4);
		if (r >= 3) { r = 2;}
		if (r != 0) {s = "resource/title"+r+".codex";}
		new Level(s,64);
		// adding the event handlers to this instance of the main class
		// listeners for keystrokes and mouse clicks/movement
		addKeyListener(Event.getInstance());
		addMouseListener(Event.getInstance());
		addMouseMotionListener(Event.getInstance());
		setFocusable(true);
		requestFocus();
		// setting up the main window
		setSize(width,height);
		setPreferredSize(new Dimension(width,height));
		input.editor.Editor.getInstance();
		Console.getInstance();
		frame = new JFrame();
		frame.setUndecorated(true);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.add(this);
		frame.setTitle(title);
		frame.setResizable(false);
		frame.pack();
		frame.setLocationRelativeTo(null);
		frame.setExtendedState(JFrame.MAXIMIZED_BOTH);
		frame.setVisible(true);
		start();
		// a call which starts the second thread
	}
	
	public void run() {
		// screen is the image that each frame will be drawn on
		// it is hardware accelerated meaning it is stored in the systems video ram (VRAM)
		screen = createVolatileImage(width,height);
		// intializing the variables that are used to time the update and FPS counters
		lastFPSCount = System.currentTimeMillis();
		lastUpdateCount = System.currentTimeMillis();
		// this loop is the "game" loop, what it essentially does is call the tick method 60 times a second
		// the loop has a tick qouta which it has to keep. If it is behind by a few updates then a few frames (render calls)
		// are skipped in order to catch up
		while(Console.getIsRunning()) {
			if (!isSwitching) {
			loops = 0;
			long SKIP_TICKS = Console.getSkipTicks();
			long FRAME_WAIT_TIME = Console.getFrameWaitTime();
			while( System.currentTimeMillis() > next_game_tick && loops < MAX_FRAMESKIP) {
		        tick();
		        next_game_tick += SKIP_TICKS;
		        loops++;
		    }
			render();
			// the render method is called at least 60 times a secod
			// frames can be sacrificed for a tick when needed
			// the loop has an ideal amount of time that should be inbetween frames
			// but is often behind because of the time taken to process a tick
			// so a calculation is used to wait for a shorter amount of time
			// to compensate for this
			if (lastFrame < FRAME_WAIT_TIME) {
				try {
					Thread.sleep((FRAME_WAIT_TIME - lastFrame ) / 1000000);
				} catch(Exception e) {}
			} else if(lastFrame == FRAME_WAIT_TIME) {
				try {
					Thread.sleep(FRAME_WAIT_TIME);
				} catch(Exception e) {}
			}
			} else {
				try {
					Thread.sleep(1000 / 10);
				} catch(Exception e) {}
			}
		}
	}
	
	
	public void start() {
		// the loop variable is enabled and the "run" method in this class
		// is called on a new thread (a seperate line of execution)
		Console.setIsRunning(true);
		new Thread(this).start();
	}
	
	public void stop() {
		// only used when the loop needs to end
		Console.setIsRunning(false);
	}
	
	public void tick() {
		// this method updates all of the components of the engine that rely on the game loop
		countTicks();
		checkMemory();
		if (!Console.getState() && Event.getCurrentLevel().getFirst()) {
			Event.getCurrentLevel().tick();
			Console.tick();
		} else if (!Console.getFirst()) {
			input.editor.Editor.tick();
		}
	}
	
	public void countTicks() {
		if (System.currentTimeMillis() - lastUpdateCount > 1000) {
		// if the current execution time minus the time from the last count is greater than a second
		// then the count variables is updated and the tempoary count is reset for another second
			updates = currentUpdates;
			currentUpdates = 0;
			lastUpdateCount = System.currentTimeMillis();
		} else {
			// if it hasn't been a second yet then this value is incremented
			currentUpdates++;
		}
	}
	
	// checks ram usage
	public void checkMemory() {
		Runtime runtime = Runtime.getRuntime();
		freeMemory = (int) (runtime.freeMemory() / 1024);
		totalMemory = (int) (runtime.maxMemory() / 1024);
		usedMemory = totalMemory - freeMemory;
		
	}
	
	public void render() {
		long frameStart = System.nanoTime();
		countFPS();
		if (screen.contentsLost()) { screen = createVolatileImage(width,height);}
		// a check to ensure that the volatile image hasn't been lost
		// while it does have faster access it can also be lost in any instance (since its volatile)
		Graphics2D g = (Graphics2D) screen.getGraphics(); // a declaration of a graphics context in the case of the screen image
		//g.rotate(Math.toRadians(i),width / 2,height / 2);
		//i += (int) (Math.random() * 10) - 5;
		// so anything drawn with it will be drawn on the image
		// render
		if (Event.getCurrentLevel().getFirst()) {
			// this statement just ensures that the current level isn't rendered until its constructor is finished
			Event.getCurrentLevel().render(g);
		}
		if (!Console.getFirst()) {input.editor.Editor.render(g);}
		// the render call for the inlevel editor
		// it is only called once the user is no longer on the main menu
		
		Console.render(g);
		// a call to render the components of the main menu and to render the console log
		//
		g.setColor(Color.WHITE);
		g.drawString("FPS: " + FPS,width  - 110 ,50);
		g.drawString("Updates: " + updates,width - 110,65);
		// the FPS and update count are drawn at the top right of the screen
		g = (Graphics2D) this.getGraphics();
		// the graphics context is reinitalized for the window itself
		g.drawImage(screen,0,0,null);
		// the volatile image is then drawn to the window
		g.dispose();
		// the context is no longer needed so it is disposed of
		// if this wasn't done then over time there would be alot of memory dumping in the ram
		lastFrame = System.nanoTime() - frameStart; // amount of time the frame took to render
		// lastFrame is used in the gameloop to determine how long to delay the thread
	}
	
	public void countFPS() {
		// counts the frames per second
		// functions the same as the countUpdates method
		// but is called by the render method instead
		if (System.currentTimeMillis() - lastFPSCount > 1000) {
			FPS = currentFPS;
			currentFPS = 0;
			lastFPSCount = System.currentTimeMillis();
		} else {
			currentFPS++;
		}
	}
	
	public static void fullScreen() {
		// the thread is halted for a moment while the window is set to full screen mode
		isSwitching = true;
		try {
			Thread.sleep(30);
		} catch (Exception e) {}
		frame.setVisible(false);
		frame = new JFrame();
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.add(MainInstance);
		frame.setUndecorated(true);
		frame.setLocationByPlatform(true);
		frame.setExtendedState(JFrame.MAXIMIZED_BOTH);
		frame.setVisible(true);
		isSwitching = false;
	}
	
	public static void window() {
		// the thread is halted for a moment while the window is set to windowed mode
		isSwitching = true;
		try {
			Thread.sleep(30);
		} catch (Exception e) {}
		frame.setVisible(false);
		frame = new JFrame();
		frame.setUndecorated(false);
		frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
		frame.add(MainInstance);
		frame.setTitle(title);
		frame.setResizable(false);
		frame.pack();
		frame.setLocationRelativeTo(null);
		frame.setExtendedState(JFrame.MAXIMIZED_BOTH);
		frame.setVisible(true);
		isSwitching = false;
	}
	
	public static void main(String args[]) {
		// intializing a static instance of this class
		// everything is set up in the constructor mainly because
		// it is in a non static context
		MainInstance = new Main();
	}
	
}
