<?php
header("Content-Type: application/json");

// Get JSON from request body
$data = json_decode(file_get_contents("php://input"), true);

// Check required fields
if (
    !isset($data["username"], $data["email"], $data["password"], $data["confirmPassword"], $data["name"])
) {
    echo json_encode(["status" => "error", "message" => "Missing fields"]);
    exit;
}

// Check password match
if ($data["password"] !== $data["confirmPassword"]) {
    echo json_encode(["status" => "error", "message" => "Passwords do not match"]);
    exit;
}

// Connect to DB
require_once "db.php";

// Insert user (remember to hash the password!)
try {
    $stmt = $conn->prepare("INSERT INTO users (username, name,  email, password) VALUES (?, ?, ?, ?)");
    $hashedPassword = password_hash($data["password"], PASSWORD_BCRYPT);
    $stmt->execute([$data["username"], $data["name"], $data["email"], $hashedPassword]);

    echo json_encode(["status" => "success", "message" => "User registered successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>