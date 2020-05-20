<?php
// helper fn to do sql queries
    function execute_query($query) {
        // connect to db
        $db = mysqli_connect('localhost', 'bobco', 'xabnab19', 'particle_sim');	
        // Check connection
        if (!$db) 
            die("Connection failed: " . mysqli_connect_error());

        // do the darn query
        $result = mysqli_query($db, $query);
        // check & print errors
        if (!$result) {
            echo "Error: ". mysqli_error($db) . "<br>";		
           // echo "Query: ". $query . "<br>";		
            exit();
        } else 
            return $result;
    }
?>