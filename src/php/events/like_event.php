<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}


// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($data['eventId']) || !isset($data['action'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

// Include database connection
require_once '../db.php';
$pdo = $conn;

try {
    $userId = $_SESSION['user_id'];
    $eventId = intval($data['eventId']);
    $action = $data['action'];
    
    // Check if event exists
    $query = "SELECT event_id FROM Events WHERE event_id = ? AND is_valid = 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$eventId]);
    
    if ($stmt->rowCount() === 0) {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Event not found']);
        exit;
    }
    
    if ($action === 'like') {
        // Check if already liked
        $checkQuery = "SELECT * FROM User_liked_Events 
                       WHERE User_id = ? AND Events_event_id = ?";
        $stmt = $pdo->prepare($checkQuery);
        $stmt->execute([$userId, $eventId]);
        
        if ($stmt->rowCount() === 0) {
            // Add like
            $insertQuery = "INSERT INTO User_liked_Events (User_id, Events_event_id) 
                           VALUES (?, ?)";
            $stmt = $pdo->prepare($insertQuery);
            $stmt->execute([$userId, $eventId]);
            
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'success', 
                'message' => 'Event liked successfully'
            ]);
        } else {
            header('Content-Type: application/json');
            echo json_encode([
                'status' => 'info', 
                'message' => 'Event already liked'
            ]);
        }
    } else if ($action === 'unlike') {
        // Remove like
        $deleteQuery = "DELETE FROM User_liked_Events 
                       WHERE User_id = ? AND Events_event_id = ?";
        $stmt = $pdo->prepare($deleteQuery);
        $stmt->execute([$userId, $eventId]);
        
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'success', 
            'message' => 'Event unliked successfully'
        ]);
    } else {
        header('Content-Type: application/json');
        echo json_encode([
            'status' => 'error', 
            'message' => 'Invalid action'
        ]);
    }
} catch (Exception $e) {
    // Log the error and return error message
    error_log("Error processing like/unlike: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to process request: ' . $e->getMessage()
    ]);
}