package audio;

import java.io.File;

import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;

public class SoundPlayer {

	private SoundPlayer() {}
	
	private static Clip song;
	
	// a method that can be directly be called from the class
	// it plays a specified audio file in a continuous loop
	// as long it is in the resource/audio folder and is in the .au format
	
	public static void playMusic(String s) {
		if (!s.equals("") && !s.equals("null")) {
			try {
				song = AudioSystem.getClip();
				song.open(AudioSystem.getAudioInputStream(new File("resource/audio/"+s)));
				//song.loop(Clip.LOOP_CONTINUOUSLY);
			} catch(Exception e) {}
		} else {
			if (song != null) {song.stop();}
		}
	}
	
}
