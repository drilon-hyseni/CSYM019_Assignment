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
    // Prepare and execute query to get all categories
    $stmt = $conn->prepare("SELECT category_id, category_name, created_at, is_valid FROM Category");
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