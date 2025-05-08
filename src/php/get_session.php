<?php
session_start();

// Return user session data as JSON
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'status' => 'success',
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'is_admin' => $_SESSION['is_admin'] ? true : false
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'User not logged in',
        'user_id' => 0,
        'is_logged_in' => false
    ]);
}
?>