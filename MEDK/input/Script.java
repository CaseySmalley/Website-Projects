
package input;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;

public class Script {

	private static ArrayList<File> resources;
	private BufferedReader br;
	private String scriptName;
	private String command;
	private boolean isWaiting;
	private int delay;
	private long lastWait;
	private long cast;
	
	public Script(String s) {
		File file = null;
		for (int i = 0 ; i < resources.size() ; i++) {
			String name = resources.get(i).getName();
			if (name.equals(s)) {
				file = resources.get(i);
			}
		}
		try {
			this.br = new BufferedReader(new FileReader(file));
			this.cast = System.currentTimeMillis();
			scriptName = s;
		} catch(Exception e) {}
		
	}
	
	public boolean tick() {
		
		if (isWaiting) {
			if (System.currentTimeMillis() - lastWait > delay) {
				delay = 0;
				lastWait = 0;
				isWaiting = false;
			}
		}
		
		try {
			if (!isWaiting) {
				command = br.readLine();
				if (command != null) {
				String[] c = command.split(" ");
				if (c[0].equals("wait")) {
					delay = Integer.parseInt(c[1]);
					lastWait = System.currentTimeMillis();
					isWaiting = true;
				} else {
					Console.command(command,Console.getScriptActivator(scriptName));
				}

				}
			}
			
		} catch(Exception e) {}
		
		if (command != null) {
			return false;
		} else {
			return true;
		}
	}
	
	public static void init() {
		int count = 0;
		File folder = new File("resource/scripts/");
		File[] tempResources = new File[50];
		File[] listOfFiles = folder.listFiles();

		for (File file : listOfFiles) {
		    if (file.isFile()) {
		        tempResources[count] = file;
		        count++;
		    }
		}
		
		resources = new <File>ArrayList(count);
		for (int i = 0 ; i < count ; i++) {
			resources.add(tempResources[i]);
		}
	}
	
	public String getName() { return scriptName;}
	public long getCast() { return cast;}
	public void setCast(long l) { this.cast = l;}
	public static void addResource(File f) { resources.add(f);}
	public static File getScriptFile(String s) { 
		File f = null;
		for (int i = 0 ; i < resources.size() ; i++) {
			if (resources.get(i).getName().equals(s)) {
				f = resources.get(i);
			}
		}
		
		return f;
	}
	
}
