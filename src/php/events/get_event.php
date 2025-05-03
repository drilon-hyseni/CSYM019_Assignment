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
    // Get event ID from query parameters
    $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;
    
    if ($event_id <= 0) {
        throw new Exception("Invalid event ID");
    }
    
    // Get event details
    $query = "SELECT e.*, u.username as creator_name 
             FROM Events e 
             JOIN users u ON e.created_by = u.id 
             WHERE e.event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        throw new Exception("Event not found");
    }
    
    // Get event categories
    $query = "SELECT c.category_id, c.category_name 
             FROM Category c 
             JOIN Events_has_Category ec ON c.category_id = ec.Category_category_id 
             WHERE ec.Events_event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get event images
    $query = "SELECT i.image_id, i.image_name, i.image_type, i.Image_data
             FROM Images i 
             JOIN Events_Images ei ON i.image_id = ei.Images_image_id 
             WHERE ei.Events_event_id = ? AND ei.is_valid = 1";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    $images = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convert image BLOB to base64 URL
    foreach ($images as &$image) {
        if (!empty($image['Image_data'])) {
            $image['url'] = 'data:' . $image['image_type'] . ';base64,' . base64_encode($image['Image_data']);
            unset($image['Image_data']);
        }
    }
    // Compile the response
    $response = [
        'status' => 'success',
        'event' => $event,
        'categories' => $categories,
        'images' => $images
    ];
    
    // Return the response
    header('Content-Type: application/json');
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log the error and return error message
    error_log("Error getting event details: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>