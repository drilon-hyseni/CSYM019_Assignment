<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db.php';
$pdo = $conn;

// Get event ID from JSON POST data or regular POST/GET parameters
$input_data = json_decode(file_get_contents('php://input'), true);
$event_id = 0;

// Check if data was sent as JSON
if ($input_data && isset($input_data['id'])) {
    $event_id = intval($input_data['id']);
}
// Fallback to traditional POST/GET parameters
else if (isset($_POST['id'])) {
    $event_id = intval($_POST['id']);
}
else if (isset($_GET['id'])) {
    $event_id = intval($_GET['id']);
}

// Check if event ID is provided
if ($event_id <= 0) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid event ID']);
    exit;
}

try {
    
    $pdo->beginTransaction();
      
    // Perform soft deletion by updating is_valid to 0 in the Events table
    $query = "UPDATE Events SET is_valid = 0 WHERE event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    
    // Also mark related records as invalid
    // Update Events_Images records
    $query = "UPDATE Events_Images SET is_valid = 0 WHERE Events_event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    
    // Update events categories.
    $query = "UPDATE Events_has_Category SET is_valid = 0 WHERE Events_event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    


    // Commit the transaction
    $pdo->commit();
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Event deleted successfully',
        'event_id' => $event_id
    ]);
    
} catch (Exception $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error and return error message
    error_log("Error deleting event: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>