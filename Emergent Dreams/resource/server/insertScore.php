<?php
	require "dblogin.php";
	
	try {
		$connection->query("INSERT INTO Highscores (ID,Name,Score)VALUES(NULL,'".$_GET["name"]."','".$_GET["score"]."')");
		$connection->query("CREATE TABLE OrderTable LIKE Highscores");
		$connection->query("INSERT INTO OrderTable (Name,Score) SELECT Name,Score FROM Highscores ORDER BY Score DESC");
		$connection->query("DELETE FROM OrderTable WHERE ID > 5");
		$connection->query("DROP TABLE Highscores");
		$connection->query("RENAME TABLE OrderTable TO Highscores");
	} catch(PDOException $e) {
		echo "Connection Failed: " . $e->getMessage();
	}
?>