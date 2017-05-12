package input.editor;

import java.awt.Graphics;
import java.awt.Color;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;
import java.io.File;

import javax.swing.JPanel;
import javax.swing.JFrame;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JComboBox;
import javax.swing.ImageIcon;
import javax.swing.JTextArea;
import javax.swing.JFileChooser;
import javax.swing.filechooser.FileNameExtensionFilter;
import input.editor.tool.TileSelect;
import level.tile.Tile;
import level.tile.TileList;

public class TileAttributes implements ActionListener {

	// initialized every time the tile attributes is opened via the editor UI
	// this class is to mainipulate the individual values or variables that tiles have through a UI
	
	private JFrame frame;
	private JPanel panel;
	private Tile tile;
	private JLabel type_label;
	private JLabel tile_name;
	private JLabel tile_icon;
	private JLabel AI_label;
	private JLabel script_label;
	private JTextArea script;
	private JButton script_browse;
	private JComboBox type;
	private JComboBox AI;
	private static boolean first = true;
	private static JFileChooser choice = new JFileChooser(new File("resource/scripts"));
	
	public TileAttributes(Tile t) {
		if (first) {
			// only intialized once
			FileNameExtensionFilter f = new FileNameExtensionFilter("codex files (*.codex)", "codex");
			choice.setFileFilter(f);
		}
		this.tile = t;
		String[] types = {"Air","Solid","Water"};
		String[] action = {"None","Stop","Left","Right","Jump"};
		// setting up UI
		// UI components that describe specific tiles are set up with data with the tile that was parsed through
		frame = new JFrame();
		panel = new JPanel();
		type = new JComboBox(types);
		AI = new JComboBox(action);
		script_browse = new JButton("Browse");
		tile_name = new JLabel(t.getClass().getSimpleName());
		tile_icon = new JLabel(new ImageIcon(input.Event.getCurrentLevel().getTileTextures().getFrame(tile.getID()[0],tile.getID()[1])));
		type_label = new JLabel("Collision Type");
		AI_label = new JLabel("AI Function");
		script_label = new JLabel("Tile Script");
		script = new JTextArea();
		script.setText(tile.getScript());
		frame.setTitle("Tile Attributes");
		frame.setSize(500,500);
		frame.setResizable(false);
		frame.setLocationRelativeTo(null);
		frame.add(panel);
		panel.setLayout(null);
		panel.setBackground(Color.BLACK);
		
		panel.add(type);
		panel.add(type_label);
		panel.add(tile_name);
		panel.add(tile_icon);
		panel.add(AI);
		panel.add(AI_label);
		panel.add(script);
		panel.add(script_label);
		panel.add(script_browse);
		
		tile_name.setBounds(32,10,200,30);
		tile_icon.setBounds(40,50,64,64);
		type.setBounds(20,270,150,30);
		type_label.setBounds(20,240,130,30);
		AI.setBounds(20,330,150,30);
		AI_label.setBounds(20,300,130,30);
		script.setBounds(20,390,150,30);
		script_label.setBounds(20,360,130,30);
		script_browse.setBounds(20,430,150,30);
		
		tile_name.setForeground(Color.WHITE);
		type_label.setForeground(Color.WHITE);
		AI_label.setForeground(Color.WHITE);
		script_label.setForeground(Color.WHITE);
		script_browse.setBackground(Color.CYAN);
		
		type.addActionListener(this);
		AI.addActionListener(this);
		script_browse.addActionListener(this);
		script.setEditable(false);
		
		frame.setVisible(true);
		
		AI.setSelectedIndex(tile.getFunction());
		type.setSelectedIndex(tile.getType());
		if (first) { first = false;}
	}
	
	public void actionPerformed(ActionEvent e) {
		
		// event handling
		
		if (e.getSource() == AI) {
			tile.setFunction(AI.getSelectedIndex());
		}		
		
		if (e.getSource() == type) {
			tile.setType(type.getSelectedIndex());
		}
		
		if (e.getSource() == script_browse) {
			choice.showDialog(null,"Open");
			script.setText(choice.getSelectedFile().getName());
			tile.setScript(choice.getSelectedFile().getName());
		}
	}
	
}
