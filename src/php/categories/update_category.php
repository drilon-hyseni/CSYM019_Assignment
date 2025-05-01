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

// Check if required fields are provided
if (!isset($data['id']) || !isset($data['name'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Extract data
$id = $data['id'];
$name = $data['name'];



try {
    // Check if username already exists for another user
    $stmt = $conn->prepare("SELECT category_id FROM Category WHERE category_name = ? AND category_id != ?");
    $stmt->execute([$name, $id]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Category already exists']);
        exit;
    }
    
    
    // Update category in database
    $stmt = $conn->prepare("UPDATE Category SET category_name = ? WHERE category_id = ?");
    $result = $stmt->execute([$name, $id]);
    
    if ($result) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'Category updated successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to update category']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>