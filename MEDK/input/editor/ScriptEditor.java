package input.editor;
import input.Console;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.File;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import java.awt.Color;
import java.awt.Rectangle;
import javax.swing.JButton;
import javax.swing.JTextArea;
import javax.swing.JFileChooser;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JFrame;
import javax.swing.filechooser.FileNameExtensionFilter;

public class ScriptEditor implements ActionListener {
	// the action listener is an event handler
	// which can trigger events for swing UI components
	// through the use of the actionPerformed method

	// This class is just used to edit script files save/load and test their contents
	
	private JFrame frame;
	private JPanel panel;
	private JButton new_script;
	private JButton save_script;
	private JButton load_script;
	private JButton test_script;
	private JTextArea script;
	private JFileChooser choice;
	
	
	// the editor can be initalized with a string that is the name of a script file
	// if so then it sets up the UI and loads its content into the editing window
	
	public ScriptEditor() {
		UI();
	}
	
	public ScriptEditor(String s) {
		UI();
		try {
			BufferedReader br = new BufferedReader(new FileReader(s));
			String nextLine = br.readLine();
			while(nextLine != null) {
				script.append(nextLine + "\n");
				nextLine = br.readLine();
			}
			br.close();
		} catch(Exception e) {}
	}
	
	public void UI() {
		// UI setup
		FileNameExtensionFilter codexFilter = new FileNameExtensionFilter("codex files (*.codex)", "codex");
		choice = new JFileChooser(new File("resource/scripts"));
		choice.setFileFilter(codexFilter);
		// intialzing a UI component which is a dialouge which can only open files with a .codex extension
		frame = new JFrame("MEDK Script Editor");
		panel = new JPanel();
		frame.setSize(800,600);
		frame.setResizable(false);
		frame.setLocationRelativeTo(null);
		frame.add(panel);
		panel.setLayout(null);
		panel.setBackground(Color.BLACK);
		
		new_script = new JButton("new");
		save_script = new JButton("save");
		load_script = new JButton("load");
		test_script = new JButton("test");
		script = new JTextArea();
		
		new_script.setBounds(new Rectangle(10,10,130,30));
		save_script.setBounds(new Rectangle(150,10,130,30));
		load_script.setBounds(new Rectangle(290,10,130,30));
		test_script.setBounds(new Rectangle(430,10,130,30));
		script.setBounds(new Rectangle(10,50,770,510));
		
		new_script.setBackground(Color.CYAN);
		save_script.setBackground(Color.CYAN);
		load_script.setBackground(Color.CYAN);
		test_script.setBackground(Color.CYAN);
		script.setBackground(Color.PINK);
		
		// enabling the event handler on UI components
		
		new_script.addActionListener(this);
		save_script.addActionListener(this);
		load_script.addActionListener(this);
		test_script.addActionListener(this);
		
		panel.add(new_script);
		panel.add(save_script);
		panel.add(load_script);
		panel.add(test_script);
		panel.add(script);
		
		frame.setVisible(true);
	}
	
	// called when the save button is clicked
	public void save() {
		// opens the file chosing dialouge with the option of 
		choice.showDialog(null,"save");
		String[] text = script.getText().split("\n");
		// splitting the contents of the text box into an array
		// each substring is divided every time the special character for a new line is found "\n"
		try {
			BufferedWriter bw = new BufferedWriter(new FileWriter(choice.getSelectedFile()));
			for (int i = 0 ; i < text.length ; i++) {
				if (i != (text.length - 1)) {bw.write(text[i] + "\n");} else {bw.write(text[i]);}
			}
			bw.close();
			// writing each line of the text array to a .codex file one line at a time
			// if an existing script file was selected in the dialouge above
			// then it becomes overwritten with the new script
			input.Script.addResource(choice.getSelectedFile());
			// the updated or new script is added to the main memory
			// so it can be run without having to start the engine
		} catch(Exception e) {}
	}
	
	public void load() {
		// the file dialouge is opened with the option to chose a .codex script file
		script.setText("");
		choice.showDialog(null,"open");
		// once chosen the text field in the window is appended with each line of the script
		File f = choice.getSelectedFile();
		if (f != null) {
			try {
				BufferedReader br = new BufferedReader(new FileReader(f));
				String nextLine = br.readLine();
				while(nextLine != null) {
					script.append(nextLine + "\n");
					nextLine = br.readLine();
				}
				br.close();
			} catch(Exception e) {}
		}
		
	}
	
	public void test() {
		// each line of the script in the editor is tested with the testCommand method
		// which returns true if sucessfull
		String[] text = script.getText().split("\n");
		boolean sucessful = true;
		int line = 0;
		for (int i = 0 ; i < text.length ; i++) {
			if (!Console.testCommand(text[i])) {
				sucessful = false;
				line = i;
			}
		}
		
		// depending on the result of the test a dialouge is used to inform the user of the result
		
		if (sucessful) {
			JOptionPane.showMessageDialog (null, "Script sucessful", "", JOptionPane.INFORMATION_MESSAGE);

		} else {
			JOptionPane.showMessageDialog (null, "Script error on line " + line, "", JOptionPane.ERROR_MESSAGE);
		}
	}
	
	public void actionPerformed(ActionEvent e) {
		// events for all the buttons on the UI
		if (e.getSource() == new_script) {script.setText("");}
		if (e.getSource() == save_script) {save();}
		if (e.getSource() == load_script) {load();}
		if (e.getSource() == test_script) {test();}
		
	}
	
}
