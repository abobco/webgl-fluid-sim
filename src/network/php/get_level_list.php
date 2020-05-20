<?php
    include "util.php";

    $result = execute_query("SELECT name FROM level");
    while ($row = mysqli_fetch_assoc($result)){
        echo $row['name'] . "\n";
    }

?>