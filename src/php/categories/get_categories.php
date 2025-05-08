<?php
// Start session if not already started
session_start();

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db.php';

try {
    // Prepare and execute query to get all categories
    $stmt = $conn->prepare("SELECT * FROM Category WHERE is_valid = 1");
    $stmt->execute();
    
    // Get all users
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return success with users array
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'categories' => $categories]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>