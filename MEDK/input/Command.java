package input;

import java.awt.Color;
import java.lang.reflect.Method;

import level.Level;
import level.tile.TileList;
import entity.*;
import entity.particle.ParticleEmitter;

public class Command {

	// contains all of the methods that serve as console commands
	
	private Command() {}
	
	

	public static Command getInstance() {
		return new Command();
	}
	
	// returns the an object of a method of this class (reflection library)
	// that has the same name as the argument given
	public static Method getCommand(String s) {
		Method[] methods = Command.class.getDeclaredMethods();
		Method method = null;
		for (Method m : methods) {
			if (m.getName().equals(s)) {
				method = m;
			}
		}
		return method;
	}
	// engine commands
	// if the command has a string argument then it uses a level / console prefix
	// if it has an entity and string arguments then it is an entity command
	// the string parsed into these methods are the arguments given in the script command
	public static void setlog(String s) {
		Console.setLog(Boolean.parseBoolean(s));
	}
	
	public static void playmusic(String s) {
		audio.SoundPlayer.playMusic(s);
	}
	
	public static void setlighting(String s) {
		input.Event.getCurrentLevel().setLighting(Boolean.parseBoolean(s));
	}
	
	public static void setplayer(String s) {
		Event.setPlayer(Event.getCurrentLevel().getEntityReference(s));
	}
	
	public static void setsecondplayer(String s) {
		Event.setSecondPlayer(Event.getCurrentLevel().getEntityReference(s));
	}
	
	public static void setfps(String s) {
		Console.setFPSLimit(Integer.parseInt(s));
	}
	
	public static void setticks(String s) {
		Console.setTickLimit(Integer.parseInt(s));
	}
	
	public static void addscript(String s) {
		Console.addScript(s,null);
	}
	
	public static void setstate(String s) {
		Console.setState(Boolean.parseBoolean(s));
	}
	
	public static void setscriptdisplay(String s) {
		Event.getCurrentLevel().setScriptHighlight(Boolean.parseBoolean(s));
	}
	
	public static void save(String s) {
		Event.getCurrentLevel().save(s);
	}
	
	public static void load(String s) {
		new Level(s,64);
	}
	// level commands
	public static void setantialiasing(String b) {
		Event.getCurrentLevel().setAntiAliasing(Boolean.parseBoolean(b));
	}
	
	public static void setamount(String s) {
		String[] tokens = s.split(" ");
		int x = Integer.parseInt(tokens[0]);
		int y = Integer.parseInt(tokens[1]); 
		Event.getCurrentLevel().getTile(x,y).setAmount(Integer.parseInt(tokens[2]));
	}
	// requires a reference
	public static void setrendertarget(String s) {
		Level l = Event.getCurrentLevel();
		l.setRenderTarget(l.getEntityReference(s));
	}
	
	public static void sethealth(Entity e,String s) {
		e.setHealth(Integer.parseInt(s));
	}
	
	public static void setname(Entity e,String s) {
		e.setName(s);
	}
	
	public static void setparent(Entity e,String s) {
		if (!s.equals("null")) {
			e.setParent(Event.getCurrentLevel().getEntityReference(s));
		} else {
			e.setParent(null);
		}
	}
	
	public static void addentity(String s) {
		String[] tokens = s.split(" ");
		Level l = Event.getCurrentLevel();
		Entity e = null;
		if (tokens[0].equals("enemy")) {
			e = new BaseEnemy();
		} else if (tokens[0].equals("ghost")) {
			
		} else if (tokens[0].equals("human")) {
			e = new Human();
		} else if (tokens[0].equals("player")) {
			e = new Human();
			Event.setPlayer(e);
			Event.getCurrentLevel().setRenderTarget(e);
		} else if(tokens[0].equals("tnt")) {
			e = new TNT();
		} else if(tokens[0].equals("lastson")) {
			e = new BlackHole();
		} else if(tokens[0].equals("light")) {
			e = new Light();
		}

		if (tokens.length == 4) {
			e.setReference(tokens[3]);
		}
		e.setPos(Double.parseDouble(tokens[1]),Double.parseDouble(tokens[2]));
		l.addEntity(e);
	}
	
	public static void settime(String s) {
		if (s.equals("day")) {
			Event.getCurrentLevel().setTime(true);
		} else if (s.equals("night"))  {
			Event.getCurrentLevel().setTime(false);
		}
	}
	
	public static void setbgcolor(String s) {
		String[] tokens = s.split(" ");
		int r = Integer.parseInt(tokens[0]);
		int g = Integer.parseInt(tokens[1]);
		int b = Integer.parseInt(tokens[2]);
		Event.getCurrentLevel().setBGColor(new Color(r,g,b));
	}
	
	public static void setfgcolor(String s) {
		String[] tokens = s.split(" ");
		int r = Integer.parseInt(tokens[0]);
		int g = Integer.parseInt(tokens[1]);
		int b = Integer.parseInt(tokens[2]);
		Event.getCurrentLevel().setFGColor(new Color(r,g,b));
	}
	
	public static void addemitter(String s) {
		String[] tokens = s.split(" ");
		Level l = Event.getCurrentLevel();
		int x = Integer.parseInt(tokens[1]);
		int y = Integer.parseInt(tokens[2]);
		if (tokens[0].equals("fire")) {
			l.addEmitter(new ParticleEmitter(x,y,50,new Color(250,200,0),ParticleEmitter.FIRE,100));
		} else if (tokens[0].equals("particle")) {
			l.addEmitter(new ParticleEmitter(x,y,300,new Color(0,125,255),ParticleEmitter.PARTICLE,10));
		}
	}
	
	public static void settile(String s) {
		String[] tokens = s.split(" ");
		String id = tokens[2];
		Level l = Event.getCurrentLevel();
		int x = Integer.parseInt(tokens[0]);
		int y = Integer.parseInt(tokens[1]);
		l.setTile(x,y,TileList.getTile(Integer.parseInt("" + id.charAt(0)),Integer.parseInt("" + id.charAt(1)),Integer.parseInt("" + id.charAt(2)),Integer.parseInt("" + id.charAt(3)),0,0));
	}
	
	public static void setgravity(String s) {
		Event.getCurrentLevel().setGravity(Double.parseDouble(s));
	}
	
	public static void setmaxgravity(String s) {
		Event.getCurrentLevel().setMaxGravity(Double.parseDouble(s));
	}
	
	public static void setweather(String s) {
		Event.getCurrentLevel().setWeather(Boolean.parseBoolean(s));
	}
	
	public static void setweathertype(String s) {
		int i = 0;
		if (s.equals("rain")) {
			i = entity.particle.ParticleEmitter.RAIN;
		} else if (s.equals("snow")) {
			i = entity.particle.ParticleEmitter.SNOW;
		}
		Event.getCurrentLevel().setWeatherType(i);
	}
	
	// entity commands (uses map references)
	public static void setpos(Entity e,String s) {
		String[] tokens = s.split(" ");
		e.setPos(Double.parseDouble(tokens[0]),Double.parseDouble(tokens[1]));
	}
	
	public static void sethostile(Entity e,String s) {
		e.setHostile(Boolean.parseBoolean(s));
	}
	
	public static void setvelocity(Entity e,String s) {
		String[] tokens = s.split(" ");
		e.setVelocity(Double.parseDouble(tokens[0]),Double.parseDouble(tokens[1]));
	}
	
	public static void addvelocity(Entity e,String s) {
		String[] tokens = s.split(" ");
		e.addVelocity(Double.parseDouble(tokens[0]),Double.parseDouble(tokens[1]));
	}
	
	public static void setmaxspeed(Entity e,String s) {
		e.setMaxSpeed(Double.parseDouble(s));
	}
	
	public static void setleft(Entity e,String s) {
		e.setLeft(Boolean.parseBoolean(s));
	}
	
	public static void setright(Entity e,String s) {
		e.setRight(Boolean.parseBoolean(s));
	}
	
	public static void setjumping(Entity e,String s) {
		e.setJumping(Boolean.parseBoolean(s));
	}
	
	public static void setcontrols(Entity e,String s) {
		e.setControls(Boolean.parseBoolean(s));
	}
	
	public static void kill(Entity e,String s) {
		e.kill();
	}
	
	public static void setalpha(Entity e,String s) {
		e.setAlpha(Boolean.parseBoolean(s));
	}
	
	public static void settarget(Entity e,String s) {
		if (e.getClass() == BaseEnemy.class) {
			BaseEnemy be = (BaseEnemy) e;
			be.setTarget(Event.getCurrentLevel().getEntityReference(s));
		}
	}
}
