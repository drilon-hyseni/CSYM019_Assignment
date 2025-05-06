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

// Get user ID from session
$user_id = $_SESSION['user_id'];

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}

// Get form data
$name = trim($_POST['name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

// Validate required fields
if (empty($name) || empty($username) || empty($email)) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Please enter a valid email address']);
    exit;
}

try {
    // Start transaction
    $conn->beginTransaction();
    
    // Check if username is already taken by another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = :username AND id != :user_id");
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        throw new Exception('Username is already taken');
    }
    
    // Check if email is already taken by another user
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = :email AND id != :user_id");
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        throw new Exception('Email address is already in use');
    }
    
    // Update user profile
    if (!empty($password)) {
        // Hash the new password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Update user with new password
        $stmt = $conn->prepare("UPDATE users SET name = :name, username = :username, email = :email, password = :password WHERE id = :user_id");
        $stmt->bindParam(':password', $hashed_password, PDO::PARAM_STR);
    } else {
        // Update user without changing password
        $stmt = $conn->prepare("UPDATE users SET name = :name, username = :username, email = :email WHERE id = :user_id");
    }
    
    $stmt->bindParam(':name', $name, PDO::PARAM_STR);
    $stmt->bindParam(':username', $username, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    // Update session username
    $_SESSION['username'] = $username;
    
    // Commit the transaction
    $conn->commit();
    
    // Return success
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
} catch (Exception $e) {
    // Rollback the transaction
    $conn->rollBack();
    
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>