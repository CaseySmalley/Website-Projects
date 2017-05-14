using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;

namespace Assignment {

    class Program {

        enum constants {CONSOLE_WIDTH = 80, MAX_LINES = 20}
        const double KB_MULTIPLIER = 0.001; // multiplier to convert Bytes into KiloBytes
        bool isRunning = true;
        double fileSizeFilter = 0;
        bool fileMonthFilter = false;
        string currentDirectory = "C:\\Windows";
        const string divider = "--------------------------------------------------------------------------------"; // constant used to save retyping the string
        

        public Program() { // constructor called from main method
            Console.BackgroundColor = ConsoleColor.DarkBlue;
            Console.ForegroundColor = ConsoleColor.White;
            Console.CancelKeyPress += delegate(object sender, ConsoleCancelEventArgs e) {e.Cancel = true;}; // delegated event handler to catch when CTRL + C is pressed and cancel it
            mainLoop();
        }

        /*
         * Below in the main loop, the "mainMenuText" array contains text that is drawn first drawn at the top of the console
         * each string in the array is treated as a seperate line
         * 
         * The 'mainMenuOptions' array contains the options that will be avilaible to the user once the program starts
         * 'doSelection' prompts the user to choose one of the options that was given as a parameter and will return
         * the index of the string that was chosen, hence the following switch statement
        */

        void mainLoop() {
            while(isRunning) { // loop runs untill "-Exit-" is chosen
                string[] mainMenuOptions = {"-File Explorer-","-Folder Statistics-","-Help/Options-","-Exit-"}; // Options the user can choose
                string[] mainMenuText = {"","Pesudo File Explorer","","Use '↑' '↓' And Enter To Navigate The Menu","","Current Directory: " + currentDirectory,""};
                switch(doSelection(mainMenuOptions,mainMenuText)) {
                    case 0: fileExplorer(); break;
                    case 1: folderStats(); break;
                    case 2: helpMenu(); break;
                    case 3: isRunning = false; break; // breaks the loop
                }
            }
        }

        void fileExplorer() {
            string filter = ""; // holds filters for file names and extensions
            while(true) {
                DirectoryInfo currentFolder;
                FileInfo[] files;
                DirectoryInfo[] directories;
                string[] filters = filter.Split(','); // seperates any entered filters into an array

                try {
                    currentFolder = new DirectoryInfo(currentDirectory);
                    files = currentFolder.GetFiles();
                    directories = currentFolder.GetDirectories();
                } catch(Exception) {    // attemps to access the current directory, but if any error occurs
                                        // it goes to the previous folder
                    string[] folderStrings = currentDirectory.Split('\\');
                    currentDirectory = folderStrings[0] + "\\";
                    for (int i = 1 ; i < folderStrings.Length - 2 ; i++) {
                        currentDirectory += folderStrings[i] + "\\";
                }

                    currentFolder = new DirectoryInfo(currentDirectory);
                    files = currentFolder.GetFiles();
                    directories = currentFolder.GetDirectories();
                }
                                                                       // a temp array that initizialised to the maximum possible amount of folders and files that are present
                string[] tempFileChoiceDisplay = new string[files.Length + directories.Length]; 
                int nextPos = 0;

                for (int i = 0 ; i < directories.Length ; i++) { // listing nested folders
                        tempFileChoiceDisplay[nextPos] = "|" + directories[i].Name + "|";
                        nextPos++;
                }

                // listing files in current directory and ommiting any files that don't pass all the filters
                for (int i = 0 ; i < files.Length ; i++) {
                    for (int i2 = 0 ; i2 < filters.Length ; i2++) {
                        if (files[i].Name.Contains(filters[i2])) {
                            if (fileSizeFilter != 0 && Math.Abs( (files[i].Length * KB_MULTIPLIER) - fileSizeFilter ) < 1024 || fileSizeFilter == 0) {
                                if (fileMonthFilter && DateTime.Now.AddMonths(-1).CompareTo(files[i].LastAccessTime) > 0|| !fileMonthFilter) {
                                    tempFileChoiceDisplay[nextPos] = spaceLine("  " + files[i].Name,"[" + (files[i].Length * KB_MULTIPLIER) + " KB]");
                                    nextPos++;
                                    break;
                                }
                            }
                        }
                    }
                }

                string[] fileChoiceDisplay = new string[nextPos];

                for (int i = 0 ; i < nextPos ; i++) {   // truncating unused positions in the temp array
                    fileChoiceDisplay[i] = tempFileChoiceDisplay[i];
                }

                string[] displayText = {"",spaceLine("Files In: " + currentDirectory,"Current Filter: " + filter),divider}; // interface for file explorer
                int choice = doSelection(fileChoiceDisplay,displayText);
                switch(choice) {
                    case -1: return; // if escape is pressed then return to the main menu
                    case -2:
                            string[] folderStrings = currentDirectory.Split('\\');  // if backspace is used then go back a folder
                            currentDirectory = folderStrings[0] + "\\";             // this is done by truncating the current folders name from the current directory
                            for (int i = 1 ; i < folderStrings.Length - 2 ; i++) {
                                currentDirectory += folderStrings[i] + "\\";
                            }
                        break;
                    case -3:
                        filterPrompt(ref filter); // request new file filter
                        break;
                    default:
                        if (choice >= 0 && choice <= directories.Length - 1) {  // checks if a folder or a file has been selected
                            currentDirectory += directories[choice].Name + "\\"; // enter new folder
                        } else {
                            fileInfo(files[choice - directories.Length]); // view stats for selected file
                        }
                        break;
                }
            }
        }

        void filterPrompt(ref string filter) {
            Console.Clear();
            Console.WriteLine("Enter A New Filter, seperate search items with ','");
            Console.WriteLine("May contain parts of file names or extensions e.g. '.exe' or 'fish'");
            Console.WriteLine(divider);
            Console.WriteLine();
            filter = Console.ReadLine().Replace(" ",""); // removes any blank spaces
        }

        string spaceLine(string s1,string s2) { // returns a string, when printed will have 'S1' on the left on the console and 'S2' on the right of the console
            string spacedLine = s1;
            int spacesNeeded = (int) constants.CONSOLE_WIDTH - (s1.Length + s2.Length) - 6;
            for (int i = 0 ; i < spacesNeeded ; i++) {
                spacedLine += " ";
            }
                spacedLine += s2;
            return spacedLine;

        }

        void fileInfo(FileInfo f) {
            string[] displayText = {"","Stats For: " + "'"+f.Name+"'" // setting up UI with the apropriate file information
                                       ,divider
                                       ,"File: " + "'"+f.Name+"'",""
                                       ,"Full File Name: " + "'"+f.FullName+"'",""
                                       ,spaceLine("File Size:","[" + (f.Length * KB_MULTIPLIER) + " KB]"),""
                                       ,spaceLine("Created: ","[" + f.CreationTime.ToString() + "]"),""
                                       ,spaceLine("Last Accessed: ","[" + f.LastAccessTime + "]"),"",divider
                                   };
           
            string[] choiceDisplay = {"-Open-","-Back-"};
            switch(doSelection(choiceDisplay,displayText)) {
                case 0:
                    Process.Start("Notepad.exe",f.FullName); // if the file can be accessed, it is then opened with notepad
                    break;
            }
        }

        void folderStats() {
            DirectoryInfo currentFolder = new DirectoryInfo(currentDirectory);
            FileInfo[] files = currentFolder.GetFiles();

            /*
             * Simply retreives/calculates some gineric stats for the current folder and any memory calculayed is converted to kilobytes
             */

            double folderSize = 0;
            double largestFileSize = 0;
            double averageFileSize = 0;

            string largestFileDisplay = "    ";

            for (int i = 0 ; i < files.Length ; i++) {
                folderSize += (int) files[i].Length;
                if ((int) files[i].Length > largestFileSize) {
                    largestFileSize = (int) files[i].Length;
                    largestFileDisplay = "'" + files[i].Name + "'" + " [" + (largestFileSize * KB_MULTIPLIER) + " KB]";
                }
            }

            averageFileSize = (folderSize / files.Length) * KB_MULTIPLIER; // average number of bytes is calculated and converted into kilo bytes (So its more readable to humans)
            folderSize *= KB_MULTIPLIER;

            Console.Clear();
            Console.WriteLine("");
            Console.WriteLine("Folder Statistics For: '" + currentDirectory + "'");
            Console.WriteLine(divider);
            Console.WriteLine("");
            Console.WriteLine("Total Files:                                                                   ".Remove((int) constants.CONSOLE_WIDTH - files.Length.ToString().Length - 3) + "[" + files.Length + "] ");
            Console.WriteLine("Memory Used In Folder:                                                         ".Remove((int) constants.CONSOLE_WIDTH - folderSize.ToString().Length - 6) + "[" +folderSize + " KB] ");
            Console.WriteLine("Largest File:                                                                  ".Remove((int) constants.CONSOLE_WIDTH - largestFileDisplay.Length - 1) + largestFileDisplay + " ");
            Console.WriteLine("Average File Size:                                                             ".Remove((int) constants.CONSOLE_WIDTH - averageFileSize.ToString().Length - 6) + "[" + averageFileSize + " KB]" + " ");
            
            Console.ReadKey();
        }

        void helpMenu() {
            while(true) {

                string[] displayText = { // User Interface
                "","Keys Are Listed Below",
                "",
                divider,
                " '↑' '↓' & 'Enter' - Navigate Menus","",
                " 'Escape - Go Back","",
                " 'F' - Change File Filter (In File Explorer)","",
                " 'Backspace' - Go Back A Folder (In File Explorer)",
                "",divider,""
                };

                string[] choiceDisplay = {
                "-Filter For Files Sizes: " + fileSizeFilter + " KB",
                "-Filter For Files Accessed In The Last Month: " + fileMonthFilter
                ,"-Back-"
                };

                switch(doSelection(choiceDisplay,displayText)) {
                    case 0: 
                        Double.TryParse(Console.ReadLine(),out fileSizeFilter); // filter input for filesize, is automatically validated
                        ; break;
                    case 1: fileMonthFilter = !fileMonthFilter; break;
                    case 2: return; // return to main menu with the "-back-" option or the escape key
                    case -1: return;
                }
            }
        }

        /*
         * 'doSelect' takes 2 arrays of strings for a selection menu and returns an index
         * 
         * 'text' is printed out before anything else and is used for user interface, every string in it is treated as a seperate line
         * 
         * 's' contains all the options that are given to the user and upon selection, the index that is returned refers to the chosen string in the 's' array
         * 
         * 
        */
        int doSelection(string[] s,string[] text) {
            bool hasSelected = false;
            int currentSelection = 0;
            int listMin = 0; // boundaries used to control which part of the 's' array is printed to the console
            int listMax = listMin + (int) constants.MAX_LINES;
            while(!hasSelected) { // loops untill a special key is pressed or a selection is made
                listMin = currentSelection - ((int) constants.MAX_LINES / 2);
                listMax = listMin + (int) constants.MAX_LINES; // update boundaries
                if (listMin < 0) {listMin = 0; listMax = (int) constants.MAX_LINES;}
                if (listMax > s.Length) {listMax = s.Length;} // to prevent an out of bounds error

                Console.Clear();

                if (text != null) {
                    for (int i = 0 ; i < text.Length ; i++) {
                        Console.WriteLine(text[i]);
                    }
                }

                for (int i = listMin ; i < listMax ; i++) {
                    if (i != currentSelection) Console.WriteLine("   " + s[i]); else Console.WriteLine(">> " + s[i]); // if a string in the 's' array has the 'currentSelected' index, it is printed with ">>" to its left
                }

                switch(Console.ReadKey().Key) { // listen for input
                    case ConsoleKey.UpArrow: currentSelection--; break; // change the selected index in the 's' array
                    case ConsoleKey.DownArrow: currentSelection++; break;
                    case ConsoleKey.Enter: hasSelected = true; break; // ends the loop and returns the current value of "currentSelection"
                    case ConsoleKey.Escape: return -1; // ends the function but also returns a specific value, in order to tell what key was pressed
                    case ConsoleKey.Backspace: return -2;
                    case ConsoleKey.F: return -3;
                }

                if (currentSelection < 0) currentSelection = 0; // prevent out of bounds error
                if (currentSelection > s.Length - 1) currentSelection = s.Length - 1;
                
            }
            return currentSelection;
        }

        static void Main(string[] args) {
            new Program(); // new instance of a 'Program' Object
        }
    }
}