<?php
	require "dblogin.php";
	
	$rawScores = $connection->query("SELECT * FROM Highscores",PDO::FETCH_ASSOC);
	$scores = array();
	
	while($row = $rawScores->fetch()) {
		array_push($scores,$row);
	}
	
	echo json_encode($scores);
?>