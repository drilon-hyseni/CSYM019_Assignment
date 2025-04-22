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
if (!isset($data['id']) || !isset($data['name']) || !isset($data['username']) || !isset($data['email'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Extract data
$id = $data['id'];
$name = $data['name'];
$username = $data['username'];
$email = $data['email'];
$valid = isset($data['valid']) ? $data['valid'] : 0;
$is_admin = isset($data['is_admin']) ? $data['is_admin'] : 0;

try {
    // Check if username already exists for another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
    $stmt->execute([$username, $id]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
        exit;
    }
    
    // Check if email already exists for another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $id]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
        exit;
    }
    
    // Update user in database
    $stmt = $conn->prepare("UPDATE users SET name = ?, username = ?, email = ?, valid = ?, is_admin = ? WHERE id = ?");
    $result = $stmt->execute([$name, $username, $email, $valid, $is_admin, $id]);
    
    if ($result) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'User updated successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to update user']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>