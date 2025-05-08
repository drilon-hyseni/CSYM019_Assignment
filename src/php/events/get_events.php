<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

// Include database connection
require_once '../db.php';
$pdo = $conn;

try {
    // Get all events sorted by date_created (newest first)
    $query = "SELECT * FROM Events ORDER BY date_created DESC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($events as &$event) {
        // Get associated categories
        $catQuery = "SELECT c.category_id, c.category_name 
                     FROM Category c
                     JOIN Events_has_Category ehc ON c.category_id = ehc.Category_category_id
                     WHERE ehc.Events_event_id = ?";
        $stmt = $pdo->prepare($catQuery);
        $stmt->execute([$event['event_id']]);
        $event['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Return success response with events
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Events retrieved successfully',
        'events' => $events
    ]);

} catch (Exception $e) {
    // Log the error and return error message
    error_log("Error fetching events: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to retrieve events: ' . $e->getMessage()
    ]);
}
