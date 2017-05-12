package input.editor.tool;

public class Table {

	private static double[] sin;
	private static double[] cos;
	private static double[] tan;
	
	public Table() {
		sin = new double[361];
		cos = new double[361];
		tan = new double[361];
		for (int i = 0 ; i < 360 ; i++) {
			sin[i] = Math.sin(Math.toRadians(i));
			cos[i] = Math.cos(Math.toRadians(i));
			tan[i] = Math.tan(Math.toRadians(i));
		}
	}
	
	public static double sin(int i) { if (i > -1 && i < 360) { return sin[i];} else { return 0;}}
	public static double cos(int i) { if (i > -1 && i < 360) { return cos[i];} else { return 0;}}
	public static double tan(int i) { if (i > -1 && i < 360) { return tan[i];} else { return 0;}}
	public static Vector getDirection(int angle) { return new Vector(sin(angle),-cos(angle));}
	
}
