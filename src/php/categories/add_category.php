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
if (!isset($data['name'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Extract data
$name = $data['name'];



try {
    // Check if category already exists
    $stmt = $conn->prepare("SELECT category_id FROM Category WHERE category_name = ?");
    $stmt->execute([$name]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
        exit;
    }
    
    
    // Insert new category into database
    $stmt = $conn->prepare("INSERT INTO Category (category_name, created_at) VALUES (?, NOW())");
    $result = $stmt->execute([$name]);
    
    if ($result) {
        // Get the newly created category
        $categoryId = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT category_id, category_name, created_at, is_valid  FROM Category WHERE category_id = ?");
        $stmt->execute([$categoryId]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'Cagtegory created successfully', 'category' => $category]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to create Category']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>