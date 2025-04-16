<?php
header("Content-Type: application/json");

// Get JSON from request body
$data = json_decode(file_get_contents("php://input"), true);

// Check required fields
if (
    !isset($data["username"], $data["email"], $data["password"], $data["fullname"])
) {
    echo json_encode(["status" => "error", "message" => "Missing fields"]);
    exit;
}


// Connect to DB
require_once "db.php";

// Insert user (remember to hash the password!)
try {

     // Check if username or email already exists
     $checkEmail = $conn->prepare("SELECT * FROM users WHERE email = ? And valid = true ");
     $checkEmail->execute([$data["email"]]);
 
     if ($checkEmail->rowCount() > 0) {
         echo json_encode(["status" => "error", "message" => "Email is already taken"]);
         exit;
     }

     $checkUsername = $conn->prepare("SELECT * FROM users WHERE username = ? And valid = true ");
     $checkUsername->execute([$data["username"]]);
 
     if ($checkUsername->rowCount() > 0) {
         echo json_encode(["status" => "error", "message" => "Username is already taken"]);
         exit;
     }


    $stmt = $conn->prepare("INSERT INTO users (username, name,  email, password) VALUES (?, ?, ?, ?)");
    $hashedPassword = password_hash($data["password"], PASSWORD_BCRYPT);
    $stmt->execute([$data["username"], $data["fullname"], $data["email"], $hashedPassword]);

    echo json_encode(["status" => "success", "message" => "User registered successfully"]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>