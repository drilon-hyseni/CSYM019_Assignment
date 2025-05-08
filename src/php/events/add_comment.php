<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}


$data = json_decode(file_get_contents('php://input'), true);

require_once '../db.php';
$pdo = $conn;

try {
    if (!isset($data['event_id']) || !isset($data['comment'])) {
        throw new Exception("Missing required fields");
    }
    
    $event_id = intval($data['event_id']);
    $comment = trim($data['comment']);
    $user_id = $_SESSION['user_id'];
    
    if (empty($comment)) {
        throw new Exception("Comment cannot be empty");
    }
    
    $query = "INSERT INTO Comments (comment, User_id, Events_event_id) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($query);
    $result = $stmt->execute([$comment, $user_id, $event_id]);
    
    if (!$result) {
        throw new Exception("Failed to add comment");
    }
    
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Comment added successfully',
        'comment_id' => $pdo->lastInsertId()
    ]);
    
} catch (Exception $e) {
    error_log("Error adding comment: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}