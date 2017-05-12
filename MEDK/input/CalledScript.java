package input;

import entity.Entity;

public class CalledScript {

	// used to time the execution between scripts
	
	private String script;
	private Entity activator;
	private long cast;
	
	public CalledScript(String s,Entity e) {
		this.script = s;
		this.activator = e;
		this.cast = System.currentTimeMillis();
	}
	
	public String getScript() { return script;}
	public Entity getActivator() { return activator;}
	public long getCast() { return cast;}
	public void setCast(long l) { this.cast = l;}
	
}
