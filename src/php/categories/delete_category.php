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

// Check if category ID is provided
if (!isset($data['id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Category ID is required']);
    exit;
}

$categoryId = $data['id'];

try {

    $conn->beginTransaction();

    $stmt1 = $conn->prepare("DELETE FROM Event_has_Category WHERE Category_category_id = ?");
    $stmt1->execute([$categoryId]);

    // Delete category from Category table
    $stmt2 = $conn->prepare("DELETE FROM Category WHERE category_id = ?");
    $stmt2->execute([$categoryId]);

    // Commit transaction
    $conn->commit();

    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Category and related event references deleted successfully']);
} catch (PDOException $e) {
    $conn->rollBack(); // Roll back changes on error
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
