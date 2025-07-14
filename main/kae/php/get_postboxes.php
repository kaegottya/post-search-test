<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

try {
    $pdo = new PDO(
        "mysql:host=localhost;port=3306;dbname=my_user_app;charset=utf8mb4",
        "root", "admin",
        [
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
        ]
    );

    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    $searchTerm = $input['search'] ?? '';
    $searchType = $input['searchType'] ?? 'all';
    $page = max(1, intval($input['page'] ?? 1));
    $perPage = min(max(intval($input['perPage'] ?? 25), 1), 100);

    // Calculate offset
    $offset = ($page - 1) * $perPage;

    // Build base query
    $sql = "SELECT psc, adresa FROM postboxes WHERE adresa != '' AND adresa IS NOT NULL";
    $countSql = "SELECT COUNT(*) FROM postboxes WHERE adresa != '' AND adresa IS NOT NULL";
    $params = [];

    // Add search conditions based on type
    if (!empty($searchTerm)) {
        switch ($searchType) {
            case 'psc':
                $sql .= " AND psc LIKE :search";
                $countSql .= " AND psc LIKE :search";
                break;
            case 'adresa':
                $sql .= " AND adresa LIKE :search";
                $countSql .= " AND adresa LIKE :search";
                break;
            case 'all':
            default:
                $sql .= " AND (psc LIKE :search OR adresa LIKE :search)";
                $countSql .= " AND (psc LIKE :search OR adresa LIKE :search)";
                break;
        }
        $params[':search'] = '%' . $searchTerm . '%';
    }

    // Add ordering and pagination
    $sql .= " ORDER BY psc ASC LIMIT :limit OFFSET :offset";

    // Get total count first
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = $countStmt->fetchColumn();

    // Calculate total pages
    $totalPages = ceil($totalCount / $perPage);

    // Get data for current page
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $postboxes = $stmt->fetchAll();

    // Return response
    echo json_encode([
        "success" => true,
        "data" => $postboxes,
        "total" => $totalCount,
        "showing" => count($postboxes),
        "page" => $page,
        "totalPages" => $totalPages,
        "perPage" => $perPage,
        "searchType" => $searchType,
        "searchTerm" => $searchTerm
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage()
    ]);
}
?>