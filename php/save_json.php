<?php

// Get the raw POST data
$postData = file_get_contents("php://input");

// Decode the JSON data
$data = json_decode($postData, true);

// Extract the SVG string and file name
$content = $data['content'];
$fileName = $data['filename'];

file_put_contents($fileName, $content);

