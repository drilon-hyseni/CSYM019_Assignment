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
    $query = "INSERT INTO Images (Image_data, image_type, image_name, is_valid) VALUES (?, ?, ?, 1)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$image_data, $image_type, $image_name]);
    
    // Return the image ID
    return $pdo->lastInsertId();
}

// Start a transaction
try {
    $pdo->beginTransaction();
    
    // Get form data
    $event_title = htmlspecialchars(trim($_POST['event_title'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_description = htmlspecialchars(trim($_POST['event_description'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_date = htmlspecialchars(trim($_POST['event_date'] ?? ''), ENT_QUOTES, 'UTF-8');
    $location = htmlspecialchars(trim($_POST['location'] ?? ''), ENT_QUOTES, 'UTF-8');
    
    $categories = isset($_POST['categories']) ? $_POST['categories'] : [];
    $user_id = $_SESSION['user_id'];
    
    // Validate required fields
    if (empty($event_title) || empty($event_description) || empty($event_date) || empty($location) || empty($categories)) {
        throw new Exception("All required fields must be filled");
    }
    
    // Insert event into the database
    $query = "INSERT INTO Events (event_title, event_description, event_date, location, created_by) 
              VALUES (?, ?, ?, ?, NOW(), ?)";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_title, $event_description, $event_date, $location, $user_id]);
    
    // Get the new event ID
    $event_id = $pdo->lastInsertId();
    
    // Associate categories with the event
    foreach ($categories as $category_id) {
        $query = "INSERT INTO Events_has_Category (Events_event_id, Category_category_id) VALUES (?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id, $category_id]);
    }
    
    // Process uploaded image
    $image_id = null;
    if (isset($_FILES['event_image']) && !empty($_FILES['event_image']['name'])) {
        $image_id = saveImage($pdo, $_FILES['event_image']);
    }
    
    // Associate image with the event if one was uploaded
    if ($image_id) {
        $query = "INSERT INTO Events_Images (Events_event_id, Images_image_id, is_valid) VALUES (?, ?, 1)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id, $image_id]);
    }
    
    // Commit the transaction
    $pdo->commit();
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Event created successfully',
        'event_id' => $event_id
    ]);
    
} catch (Exception $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error and return error message
    error_log("Error creating event: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>