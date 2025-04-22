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
    echo json_encode(['status' => 'error', 'message' => 'User ID is required']);
    exit;
}

// Extract user ID
$userId = $data['id'];

// Don't allow admins to delete themselves
if ($userId == $_SESSION['user_id']) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'You cannot delete your own account']);
    exit;
}

try {
    // Option 1: Hard delete - completely remove the user from database
    // $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
    
    // Option 2: Soft delete - just set the valid flag to 0
    $stmt = $conn->prepare("UPDATE users SET valid = 0 WHERE id = ?");
    $result = $stmt->execute([$userId]);
    
    if ($result) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'User deleted successfully']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to delete user']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>