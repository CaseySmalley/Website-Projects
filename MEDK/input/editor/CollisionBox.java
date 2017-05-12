package input.editor;

import java.awt.Color;
import java.awt.Graphics;
import java.awt.Image;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

import entity.Entity;

public class CollisionBox {

	// this class is used as the base for the games user interface
	
	private double x;
	private double y;
	private String name;
	private Image icon;
	private int width;
	private int height;
	
	// it can be constructed with a pair of co-ordinates and an image
	// or with specified dimensions and text
	
	public CollisionBox(double x,double y,int width,int height,String s) {
		this.name = s;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	
	public CollisionBox(double x,double y,String s) {
		if (s != null) {
			try {icon = ImageIO.read(new File(s));} catch (Exception e) {}
			this.width = icon.getWidth(null);
			this.height = icon.getHeight(null);
			this.x = x;
			this.y = y;
		}
	}
	
	public CollisionBox(double x,double y,Image img) {
		if(img != null) {
			this.icon = img;
			this.width = img.getWidth(null);
			this.height = img.getHeight(null);
			this.x = x;
			this.y = y;
		}
	}
	
	public void render(Graphics g) {
		// if constructed with an image then that is just drawn at its x and y co-ordinates
		if (icon != null) {
		g.drawImage(icon,(int) x,(int) y,null);
		} else {
			// drawing the given text with standard graphics
			g.setColor(Color.WHITE);
			g.fillRect((int) x,(int) y,width,height);
			g.setColor(Color.BLACK);
			g.drawString(name,(int) (x + (width / 2)),(int) (y + (height / 2)));
		}
	}
	
	public boolean isTouching(CollisionBox e) {
		// a method copied from the entity class
		// is used in event triggering
        int tw = this.width;
        int th = this.height;
        int rw = e.getWidth();
        int rh = e.getHeight();
        if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
            return false;
        }
        int tx = (int) this.x;
        int ty = (int) this.y;
        int rx = (int) e.getX();
        int ry = (int) e.getY();
        rw += rx;
        rh += ry;
        tw += tx;
        th += ty;
        return ((rw < rx || rw > tx) &&
                (rh < ry || rh > ty) &&
                (tw < tx || tw > rx) &&
                (th < ty || th > ry));
    }
	
	public double getX() { return x;}
	public double getY() { return y;}
	public int getWidth() { return width;}
	public int getHeight() { return height;}
	public String getName() { return name;}
	
	public void setX(double x) { this.x = x;}
	public void setY(double y) { this.y = y;}
	
}
