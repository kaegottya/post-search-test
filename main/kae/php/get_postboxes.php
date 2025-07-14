<?php
// ===========================================================================================================
// Koncový bod API pro vyhledávání poštovního pole
// ===========================================================================================================
// Tento koncový bod poskytuje funkčnost vyhledávání pro poštovní pole v ČR
// podporuje stránkování, různé typy vyhledávání a vrací odpovědi v JSONu

// Nastavit záhlaví odezvy pro JSON API s podporou CORS
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

try {
    // ===========================================================================================================
    // Připojení databáze
    // ===========================================================================================================
    // Nastavit připojení PDO s databází MySQL se správnou konfigurací
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

    // ===========================================================================================================
    // Zpracování a validace vstupu
    // ===========================================================================================================
    // Přečtěte si a dekódujte vstup JSON z těla požadavku
    $input = json_decode(file_get_contents('php://input'), true);
    $searchTerm = $input['search'] ?? '';
    $searchType = $input['searchType'] ?? 'all';
    $page = max(1, intval($input['page'] ?? 1));
    $perPage = min(max(intval($input['perPage'] ?? 25), 1), 100);

    $offset = ($page - 1) * $perPage;

    // ===========================================================================================================
    // Tvorba sql queries
    // ===========================================================================================================
    // Základní dotazy - Vybere data a počítá záznamy z tabulky poštovních schránek
    // odfiltrujte prázdné adresy, pro zajištění kvality dat
    $sql = "SELECT id, psc, adresa FROM postboxes WHERE adresa != '' AND adresa IS NOT NULL";
    $countSql = "SELECT COUNT(*) FROM postboxes WHERE adresa != '' AND adresa IS NOT NULL";
    $params = []; // Array na uložení query parametrů

    // Přidání search parametrů na základě hledání
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

    $sql .= " ORDER BY psc ASC LIMIT :limit OFFSET :offset";

    // ===========================================================================================================
    // Spuštění dotazů počítání
    // ===========================================================================================================
    // Nejprve získá celkový počet odpovídajících záznamů pro stránkování
    $countStmt = $pdo->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = $countStmt->fetchColumn();

    $totalPages = ceil($totalCount / $perPage);

    // ===========================================================================================================
    // Spuštění dotazů na main query
    // ===========================================================================================================
    // Příprava a execute main query pro získání stránkovaných výsledků
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

    $stmt->execute();
    $postboxes = $stmt->fetchAll();

    // ===========================================================================================================
    // Succes
    // ===========================================================================================================
    // Vrácení čitelné JSON odpovědi s daty a metadaty
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

    // ===========================================================================================================
    // Error handling
    // ===========================================================================================================
    // Database-specific errorů / dalších errorů (od connection, query až po JSON, validace, etc.)

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