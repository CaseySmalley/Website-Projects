<?php
	$servername = "localhost";
	$username = "casmalley";
	$password = "qurigwv";
	$dbname = "casmalley";
	
	try {
		$connection = new PDO("mysql:host=$servername;dbname=$dbname",$username,$password);
		$connection->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
	} catch(PDOException $e) {
		echo "Connection Failed: " . $e->getMessage();
	}
?>