<?php
session_start();

if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized access']);
    exit;
}

require_once '../db.php';
$pdo = $conn;

try {
    $userId = $_SESSION['user_id'];
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = 6;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';

    $baseQuery = "FROM Events WHERE is_valid = 1";
    $params = [];

    if (!empty($search)) {
        $baseQuery .= " AND (event_title LIKE ? OR event_description LIKE ? OR location LIKE ?)";
        $searchParam = "%$search%";
        $params = [$searchParam, $searchParam, $searchParam];
    }

    $countQuery = "SELECT COUNT(*) as total $baseQuery";
    $eventsQuery = "SELECT * $baseQuery ORDER BY event_date ASC LIMIT $limit OFFSET $offset";

    // Execute count query
    $stmt = $pdo->prepare($countQuery);
    $stmt->execute($params);
    $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalCount / $limit);

    // Execute paginated events query
    $stmt = $pdo->prepare($eventsQuery);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($events as &$event) {
        $event['is_liked'] = false;

        $catQuery = "SELECT c.category_id, c.category_name 
                     FROM Category c
                     JOIN Events_has_Category ehc ON c.category_id = ehc.Category_category_id
                     WHERE ehc.Events_event_id = ?";
        $stmt = $pdo->prepare($catQuery);
        $stmt->execute([$event['event_id']]);
        $event['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $imgQuery = "SELECT i.image_id, i.image_name, i.image_type, i.Image_data 
                     FROM Images i 
                     JOIN Events_Images ei ON i.image_id = ei.Images_image_id 
                     WHERE ei.Events_event_id = ? AND ei.is_valid = 1
                     LIMIT 1";
        $stmt = $pdo->prepare($imgQuery);
        $stmt->execute([$event['event_id']]);
        $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($images as &$image) {
            $image['Image_data'] = base64_encode($image['Image_data']);
        }

        $event['images'] = $images;
    }

    $pagination = [
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'totalEvents' => $totalCount,
        'eventsPerPage' => $limit
    ];

    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'success',
        'message' => 'Events retrieved successfully',
        'events' => $events,
        'pagination' => $pagination
    ]);

} catch (Exception $e) {
    error_log("Error fetching events: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to retrieve events: ' . $e->getMessage()
    ]);
}
