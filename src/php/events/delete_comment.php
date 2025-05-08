<?php
session_start();
// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Include database connection
require_once '../db.php';
$pdo = $conn;

try {
    // Validate inputs
    if (!isset($data['comment_id'])) {
        throw new Exception("Missing comment ID");
    }
    
    $comment_id = intval($data['comment_id']);
    $user_id = $_SESSION['user_id'];
    
    // First check if the comment belongs to the current user
    $query = "SELECT User_id FROM Comments WHERE comment_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$comment_id]);
    $comment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$comment) {
        throw new Exception("Comment not found");
    }
    
    if ($comment['User_id'] != $user_id) {
        throw new Exception("You can only delete your own comments");
    }
    
    // Delete the comment
    $query = "DELETE FROM Comments WHERE comment_id = ?";
    $stmt = $pdo->prepare($query);
    $result = $stmt->execute([$comment_id]);
    
    if (!$result) {
        throw new Exception("Failed to delete comment");
    }
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Comment deleted successfully'
    ]);
    
} catch (Exception $e) {
    // Log the error and return error message
    error_log("Error deleting comment: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}