<?php
    include "util.php";

    $result = execute_query("SELECT * FROM level ORDER BY id DESC LIMIT 1");
    $row = mysqli_fetch_assoc($result);

    echo $row['id'];
?>