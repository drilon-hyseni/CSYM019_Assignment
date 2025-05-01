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

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Check if user ID is provided
if (!isset($data['id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Category ID is required']);
    exit;
}

// Extract user ID
$categoryId = $data['id'];



try {

    // Soft delete - just set the valid flag to 0
    $stmt = $conn->prepare("UPDATE Category SET is_valid = 0 WHERE category_id = ?");
    $result = $stmt->execute([$categoryId]);
    
    if ($result) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'Category deleted successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete category']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>