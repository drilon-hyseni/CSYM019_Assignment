<?php
session_start();
header("Content-Type: application/json");

require_once "db.php";

// Get raw input
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data["email"], $data["password"])) {
    echo json_encode(["status" => "error", "message" => "Missing fields"]);
    exit;
}

$identifier = $data["email"]; // this could be username OR email
$password = $data["password"];

try {
    // Search by either email OR username
    $stmt = $conn->prepare("SELECT * FROM users WHERE (email = ? OR username = ?) AND valid = true LIMIT 1");
    $stmt->execute([$identifier, $identifier]);

    if ($stmt->rowCount() === 0) {
        echo json_encode(["status" => "error", "message" => "User not found"]);
        exit;
    }

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify password
    if (!password_verify($password, $user["password"])) {
        echo json_encode(["status" => "error", "message" => "Invalid credentials"]);
        exit;
    }

    // Store user data in session
    $_SESSION["user_id"] = $user["id"];
    $_SESSION["username"] = $user["username"];
    $_SESSION["is_admin"] = $user["is_admin"]; // assuming this column exists

    echo json_encode([
        "status" => "success",
        "message" => "Login successful",
        "is_admin" => $user["is_admin"], // boolean/int
        "username" => $user["username"]   // optional for console log
    ]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
