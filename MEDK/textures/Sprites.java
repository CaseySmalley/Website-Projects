package textures;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Image;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;

public class Sprites {

	private static File[] resources;
	private BufferedImage spriteSheet;
	private Image[] img;
	private Image[][] frames;
	private int spriteHeight;
	private int spriteWidth;
	
	public Sprites(String s,int height,int width) {
		// the name of a image file that contains all of the animation frames is parsed in
		// the other arguments are the width and height of each individual frame
		this.spriteHeight = height;
		this.spriteWidth = width;
		File file = null;
		for (int i = 0 ; i < resources.length ; i++) {
			String name = "resource/" + resources[i].getName();
			if (name.equals(s)) {
				file = resources[i];
			}
		}
		try {
			// the specified image is called from the main memory and is then cast to a buffered image
			spriteSheet = ImageIO.read(file);
			frames = new Image[(int) (spriteSheet.getHeight() / spriteHeight )][(int) (spriteSheet.getWidth() / spriteWidth )];
			// the buffered image is then split into a 2D array of individual images which are the buffered image
			// split into small parts based on the arguments given
			for (int state = 0 ; state < frames.length ; state++) {
				for (int frame = 0 ; frame < frames[0].length; frame++) {
					// the sprite sheets are originised in the fashon of
					// each row is a different animation
					// and each image to the right of another is a seperate frame
					frames[state][frame] = spriteSheet.getSubimage(frame * spriteWidth,state * spriteHeight,spriteWidth,spriteHeight);
				}
			}
		} catch(Exception e) {System.out.println("no textures");}
		System.out.println(spriteSheet.getWidth());
	}
	
	public static void init() {
		// an init method that is called by the main constructor
		// loads all availiable resources into the systems main memory
		int count = 0;
		File folder = new File("resource/");
		File[] tempResources = new File[folder.listFiles().length];
		File[] listOfFiles = folder.listFiles();

		for (File file : listOfFiles) {
		    if (file.isFile()) {
		        tempResources[count] = file;
		        count++;
		    }
		}
		// the tempoary array which everything is loaded in is switched with a array that is only as big
		// as there are elements
		resources = new File[count];
		for (int i = 0 ; i < count ; i++) {
			resources[i] = tempResources[i];
		}
	}
	
	public Image getImage(int i) { return img[i];}
	public Image getFrame(int x,int y) {	return frames[x][y];}
	public int getAnimationLength(int state) { return frames[state].length; }
}
