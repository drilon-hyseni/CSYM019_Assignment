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

// Function to validate and save uploaded image
function saveImage($pdo, $file) {
    // Check if file exists and no errors occurred during upload
    if (!isset($file['tmp_name']) || empty($file['tmp_name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    // Validate file size (max 5MB)
    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("Image size exceeds the limit of 5MB");
    }
    
    // Validate file type
    $allowed_types = ['image/jpeg', 'image/png'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $file_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($file_type, $allowed_types)) {
        throw new Exception("Only JPG and PNG images are allowed");
    }
    
    // Read file data
    $image_data = file_get_contents($file['tmp_name']);
    $image_name = $file['name'];
    $image_type = $file_type;
    
    // Insert image into database
    $query = "INSERT INTO Images (image_data, image_type, image_name, is_valid) VALUES (?, ?, ?, 1)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$image_data, $image_type, $image_name]);
    
    // Return the image ID
    return $pdo->lastInsertId();
}

try {
    $pdo->beginTransaction();
    
    // Get event ID and validate
    $event_id = isset($_POST['event_id']) ? intval($_POST['event_id']) : 0;
    
    if ($event_id <= 0) {
        throw new Exception("Invalid event ID");
    }
    
    // Check if the event exists and if the user has permission to edit it
    $query = "SELECT created_by FROM Events WHERE event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        throw new Exception("Event not found");
    }
    
    // Check if the user is the creator of the event or an admin
    $user_id = $_SESSION['user_id'];
    $is_admin = isset($_SESSION['is_admin']) ? $_SESSION['is_admin'] : false;
    
    if ($event['created_by'] != $user_id && !$is_admin) {
        throw new Exception("You don't have permission to edit this event");
    }
    
    // Get form data
    $event_title = htmlspecialchars(trim($_POST['event_title'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_description = htmlspecialchars(trim($_POST['event_description'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_date = htmlspecialchars(trim($_POST['event_date'] ?? ''), ENT_QUOTES, 'UTF-8');
    $location = htmlspecialchars(trim($_POST['location'] ?? ''), ENT_QUOTES, 'UTF-8');
    
    $categories = isset($_POST['categories']) ? $_POST['categories'] : [];
    
    // Validate required fields
    if (empty($event_title) || empty($event_description) || empty($event_date) || empty($location) || empty($categories)) {
        throw new Exception("All required fields must be filled");
    }
    
    // Update event in the database
    $query = "UPDATE Events SET 
              event_title = ?, 
              event_description = ?, 
              event_date = ?, 
              location = ?, 
              date_updated = NOW() 
              WHERE event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_title, $event_description, $event_date, $location, $event_id]);
    
    // Update event categories - first delete existing ones
    $query = "DELETE FROM Events_has_Category WHERE Events_event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    
    // Then insert new ones
    foreach ($categories as $category_id) {
        $query = "INSERT INTO Events_has_Category (Events_event_id, Category_category_id) VALUES (?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id, $category_id]);
    }
    
    // Process uploaded images
    $image_ids = [];
    if (isset($_FILES['event_images'])) {
        for ($i = 0; $i < count($_FILES['event_images']['name']); $i++) {
            if (!empty($_FILES['event_images']['name'][$i])) {
                $file = [
                    'name' => $_FILES['event_images']['name'][$i],
                    'type' => $_FILES['event_images']['type'][$i],
                    'tmp_name' => $_FILES['event_images']['tmp_name'][$i],
                    'error' => $_FILES['event_images']['error'][$i],
                    'size' => $_FILES['event_images']['size'][$i]
                ];
                
                $image_id = saveImage($pdo, $file);
                if ($image_id) {
                    $image_ids[] = $image_id;
                }
            }
        }
    }
    
    // Associate new images with the event
    foreach ($image_ids as $image_id) {
        $query = "INSERT INTO Events_Images (Events_event_id, Images_image_id, is_valid) VALUES (?, ?, 1)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id, $image_id]);
    }
    
    // Handle removed images
    if (isset($_POST['removed_images']) && is_array($_POST['removed_images'])) {
        foreach ($_POST['removed_images'] as $image_id) {
            // Mark as invalid instead of deleting
            $query = "UPDATE Events_Images SET is_valid = 0 WHERE Events_event_id = ? AND Images_image_id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$event_id, $image_id]);
        }
    }
    
    // Commit the transaction
    $pdo->commit();
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Event updated successfully',
        'event_id' => $event_id
    ]);
    
} catch (Exception $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error and return error message
    error_log("Error updating event: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>