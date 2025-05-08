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
    
    // Get filter parameters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $dateStart = isset($_GET['date_start']) ? $_GET['date_start'] : null;
    $dateEnd = isset($_GET['date_end']) ? $_GET['date_end'] : null;
    $categories = isset($_GET['categories']) ? $_GET['categories'] : [];
    
    // Base query
    $baseQuery = "FROM Events e WHERE e.is_valid = 1";
    $params = [];

    // Add search filter
    if (!empty($search)) {
        $baseQuery .= " AND (e.event_title LIKE ? OR e.event_description LIKE ? OR e.location LIKE ?)";
        $searchParam = "%$search%";
        $params = array_merge($params, [$searchParam, $searchParam, $searchParam]);
    }
    
    // Add date range filter
    if ($dateStart && $dateEnd) {
        $baseQuery .= " AND e.event_date BETWEEN ? AND ?";
        $params = array_merge($params, [$dateStart, $dateEnd . ' 23:59:59']);
    } else if ($dateStart) {
        $baseQuery .= " AND e.event_date >= ?";
        $params = array_merge($params, [$dateStart]);
    } else if ($dateEnd) {
        $baseQuery .= " AND e.event_date <= ?";
        $params = array_merge($params, [$dateEnd . ' 23:59:59']);
    }
    
    // Add category filter
    if (!empty($categories)) {
        $baseQuery .= " AND e.event_id IN (
            SELECT DISTINCT ehc.Events_event_id 
            FROM Events_has_Category ehc 
            WHERE ehc.Category_category_id IN (";
        
        $placeholders = implode(',', array_fill(0, count($categories), '?'));
        $baseQuery .= $placeholders . "))";
        $params = array_merge($params, $categories);
    }

    // Execute count query
    $countQuery = "SELECT COUNT(DISTINCT e.event_id) as total $baseQuery";
    $stmt = $pdo->prepare($countQuery);
    $stmt->execute($params);
    $totalCount = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    $totalPages = ceil($totalCount / $limit);

    // Execute paginated events query
    $eventsQuery = "SELECT e.* $baseQuery ORDER BY e.event_date ASC LIMIT $limit OFFSET $offset";
    $stmt = $pdo->prepare($eventsQuery);
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Process each event to add related data
    foreach ($events as &$event) {
        // Check if user has liked this event
        $likeQuery = "SELECT COUNT(*) as liked FROM User_liked_Events 
                     WHERE Events_event_id = ? AND User_id = ?";
        $stmt = $pdo->prepare($likeQuery);
        $stmt->execute([$event['event_id'], $userId]);
        $event['is_liked'] = (bool)$stmt->fetch(PDO::FETCH_ASSOC)['liked'];

        // Get event categories
        $catQuery = "SELECT c.category_id, c.category_name 
                     FROM Category c
                     JOIN Events_has_Category ehc ON c.category_id = ehc.Category_category_id
                     WHERE ehc.Events_event_id = ?";
        $stmt = $pdo->prepare($catQuery);
        $stmt->execute([$event['event_id']]);
        $event['categories'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get event images
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