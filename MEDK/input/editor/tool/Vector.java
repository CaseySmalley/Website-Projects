package input.editor.tool;

public class Vector {

	private double x;
	private double y;
	
	public Vector(double x,double y) {
		this.x = x;
		this.y = y;
	}
	
	public Vector add(Vector v) {
		double x = this.x + v.getX();
		double y = this.y + v.getY();
		return new Vector(x,y);
	}
	
	public Vector subtract(Vector v) {
		double x = this.x - v.getX();
		double y = this.y - v.getY();
		return new Vector(x,y);
	}
	
	public Vector multiply(Vector v) {
		double x = this.x * v.getX();
		double y = this.y * v.getY();
		return new Vector(x,y);
	}
	
	public Vector divide(Vector v) {
		double x = this.x / v.getX();
		double y = this.y / v.getY();
		return new Vector(x,y);
	}
	
	public void setX(double d) { this.x = d;}
	public void setY(double d) { this.y = d;}
	public double getX() { return x;}
	public double getY() { return y;}
}
