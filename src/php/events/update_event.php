<?php
session_start();

// Set error handling to avoid HTML error pages
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Function to return JSON error response
function returnJsonError($message, $httpCode = 400) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => $message]);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    returnJsonError('Unauthorized access', 401);
}

// Include database connection
try {
    require_once '../db.php';
    $pdo = $conn;
} catch (Exception $e) {
    returnJsonError('Database connection error: ' . $e->getMessage(), 500);
}

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
    
    try {
        // Insert image into database
        $query = "INSERT INTO Images (Image_data, image_type, image_name, is_valid) VALUES (?, ?, ?, 1)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$image_data, $image_type, $image_name]);
        
        // Return the image ID
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        // Specific handling for data too long error
        if ($e->getCode() == '22001' || strpos($e->getMessage(), '1406') !== false) {
            throw new Exception("Image is too large for database storage. Please use a smaller image or contact administrator.");
        }
        throw $e; // Re-throw other database errors
    }
}

// Start a transaction
try {
    $pdo->beginTransaction();
    
    // Get form data
    $event_id = isset($_POST['event_id']) ? (int)$_POST['event_id'] : 0;
    $event_title = htmlspecialchars(trim($_POST['event_title'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_description = htmlspecialchars(trim($_POST['event_description'] ?? ''), ENT_QUOTES, 'UTF-8');
    $event_date = htmlspecialchars(trim($_POST['event_date'] ?? ''), ENT_QUOTES, 'UTF-8');
    $location = htmlspecialchars(trim($_POST['location'] ?? ''), ENT_QUOTES, 'UTF-8');
    $existing_image_id = isset($_POST['existing_image_id']) ? (int)$_POST['existing_image_id'] : 0;
    
    $categories = isset($_POST['categories']) ? $_POST['categories'] : [];
    $user_id = $_SESSION['  '];
    
    
    error_log("Looking for event with ID: " . $event_id . " (type: " . gettype($event_id) . ")");


    // Verify the event exists and user has permission to edit it
    $query = "SELECT created_by FROM Events WHERE event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$event) {
        throw new Exception("Event not found");
    }
    
    // Check if user is admin or event creator
    $isAdmin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
    if (!$isAdmin && $event['created_by'] != $user_id) {
        throw new Exception("You don't have permission to edit this event");
    }
    
    // Update event in the database
    $query = "UPDATE Events SET 
              event_title = ?, 
              event_description = ?, 
              event_date = ?, 
              location = ? 
              WHERE event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_title, $event_description, $event_date, $location, $event_id]);
    
    // Delete existing category associations
    $query = "DELETE FROM Events_has_Category WHERE Events_event_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$event_id]);
    
    // Insert new category associations
    foreach ($categories as $category_id) {
        $query = "INSERT INTO Events_has_Category (Events_event_id, Category_category_id) VALUES (?, ?)";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id, $category_id]);
    }
    
    // Process uploaded image
    $new_image_id = null;
    if (isset($_FILES['event_image']) && !empty($_FILES['event_image']['name'])) {
        $new_image_id = saveImage($pdo, $_FILES['event_image']);
        
        // Remove existing image association if we have a new image
        if ($new_image_id) {
            $query = "DELETE FROM Events_Images WHERE Events_event_id = ?";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$event_id]);
            
            // Associate new image with the event
            $query = "INSERT INTO Events_Images (Events_event_id, Images_image_id, is_valid) VALUES (?, ?, 1)";
            $stmt = $pdo->prepare($query);
            $stmt->execute([$event_id, $new_image_id]);
        }
    } else if ($existing_image_id == 0) {
        // If existing_image_id is 0, it means the user removed the image
        $query = "DELETE FROM Events_Images WHERE Events_event_id = ?";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$event_id]);
    }
    // No need to do anything if existing_image_id is set and no new image was uploaded
    
    // Commit the transaction
    $pdo->commit();
    
    // Return success response
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Event updated successfully',
        'event_id' => $event_id
    ]);
    
} catch (PDOException $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error
    error_log("Database error updating event: " . $e->getMessage());
    
    // Return specific error message for common database issues
    if ($e->getCode() == '22001' || strpos($e->getMessage(), '1406') !== false) {
        returnJsonError("Image is too large for database storage. Please use a smaller image or contact administrator.");
    } else {
        returnJsonError("Database error: " . $e->getMessage());
    }
} catch (Exception $e) {
    // Rollback the transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Log the error and return error message
    error_log("Error updating event: " . $e->getMessage());
    returnJsonError($e->getMessage());
}
?>