<?php
// Start session if not already started
session_start();

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db.php';

try {
    // Prepare and execute query to get all users
    $stmt = $conn->prepare("SELECT id, name, username, email, created_at, valid, is_admin FROM users");
    $stmt->execute();
    
    // Get all users
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return success with users array
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'users' => $users]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>