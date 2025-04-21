<?php
session_start();

$response = [
    "logged_in" => isset($_SESSION["user_id"]),
    "is_admin" => $_SESSION["is_admin"] ?? false,
    "username" => $_SESSION["username"] ?? null,
];

echo json_encode($response);
?>