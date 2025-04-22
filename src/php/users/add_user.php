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
if (!isset($data['name']) || !isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Extract data
$name = $data['name'];
$username = $data['username'];
$email = $data['email'];
$password = $data['password'];
$valid = isset($data['valid']) ? $data['valid'] : 1;
$is_admin = isset($data['is_admin']) ? $data['is_admin'] : 0;

try {
    // Check if username already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Username already exists']);
        exit;
    }
    
    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Email already exists']);
        exit;
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert new user into database
    $stmt = $conn->prepare("INSERT INTO users (name, username, email, password, created_at, valid, is_admin) VALUES (?, ?, ?, ?, NOW(), ?, ?)");
    $result = $stmt->execute([$name, $username, $email, $hashed_password, $valid, $is_admin]);
    
    if ($result) {
        // Get the newly created user
        $userId = $conn->lastInsertId();
        $stmt = $conn->prepare("SELECT id, name, username, email, created_at, valid, is_admin FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'User created successfully', 'user' => $user]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Failed to create user']);
    }
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>