<?php
// Start session if not already started
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db.php';

try {
    // Get the user ID from session - users can only see their own profile
    // unless they are admins
    $user_id = $_SESSION['user_id'];
    
    // If admin and requesting specific user
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1 && isset($_GET['id'])) {
        $user_id = $_GET['id'];
    }
    
    // Prepare and execute query to get user details
    $stmt = $conn->prepare("SELECT id, name, username, email, created_at, valid, is_admin FROM users WHERE id = :user_id AND valid = 1");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    // Get user data
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    // Return success with user data
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'user' => $user]);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>