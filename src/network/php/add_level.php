<?php
    include "util.php";

    $os = $_POST['OS'];
    $browser = $_POST['browser'];
    $name = $_POST['name'];

    $result = execute_query("INSERT INTO level(name, os, browser, date_created) VALUES ('$name', '$os', '$browser', NOW() )");

    $result = execute_query("SELECT * FROM level ORDER BY id DESC LIMIT 1");
    $row = mysqli_fetch_assoc($result);

    echo $row['id'];

    $doc = new DOMDocument();
    $root = $doc->createElement('root');
    $root->nodeValue = 'Everybody gangsta til the XML is 900 GB';
    $doc->appendChild($root);
    foreach ($_POST['tiles'] as $position){
        echo $position[0] . ', ' . $position[1] . "\n";

        $element = $doc->createElement('tile');
        $element->nodeValue = strval($position[0]) . ' ' . strval($position[1]);
        $root->appendChild($element);
    } 
    
    $doc->save("../levels/" . strval($row['id']) . ".xml");
    echo $_POST["time"];
?>