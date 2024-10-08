<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $dir = isset($_POST['dir']) ? '../'.$_POST['dir'].'/' : '../preview_images/';

    if (isset($_FILES['zipFile']) && $_FILES['zipFile']['error'] === UPLOAD_ERR_OK ) {
        $uploadDir = $dir;
        
        // create directory
        if(!is_dir($uploadDir)){
            mkdir($dir);
        }
        $uploadFile = $uploadDir . basename($_FILES['zipFile']['name']);

        if (move_uploaded_file($_FILES['zipFile']['tmp_name'], $uploadFile)) {

            $zip = new ZipArchive;
            if ($zip->open($uploadFile) === TRUE) {
                $zip->extractTo($uploadDir);
                $zip->close();

                //delete zip file
               unlink($uploadFile);
            } 
        } 
    } 
} else {
    echo "php available";
}