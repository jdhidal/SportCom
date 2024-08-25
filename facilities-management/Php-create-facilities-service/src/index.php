<?php

require __DIR__ . '/../vendor/autoload.php'; 

use Dotenv\Dotenv;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

// Hability errors
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Update .env
try {
    $dotenv = Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
    echo 'Variables de entorno cargadas correctamente';
} catch (Exception $e) {
    echo 'Error al cargar las variables de entorno: ', $e->getMessage();
}


$dbHost = $_ENV['DB_HOST'];
$dbUser = $_ENV['DB_USER'];
$dbPassword = $_ENV['DB_PASSWORD'];
$dbDatabase = $_ENV['DB_DATABASE'];

$dsn = "mysql:host=$dbHost;dbname=$dbDatabase;charset=utf8";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];


$rabbitMqUrl = $_ENV['RABBITMQ_URL'];

// Cors
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['REQUEST_URI'] === '/facilities') {
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }

    $name = $input['name'] ?? null;
    $descripcion = $input['descripcion'] ?? null;
    $tutor = $input['tutor'] ?? null;

    if (!$name || !$descripcion || !$tutor) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }

    try {
        
        $pdo = new PDO($dsn, $dbUser, $dbPassword, $options);

        
        $stmt = $pdo->prepare("CALL CreateFacility(?, ?, ?)");
        $stmt->execute([$name, $descripcion, $tutor]);

        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        
        $connection = AMQPStreamConnection::create_connection([
            ['url' => $rabbitMqUrl]
        ]);

        $channel = $connection->channel();
        $channel->queue_declare('facility_created', false, false, false, false);

        $messageBody = json_encode(['name' => $name, 'descripcion' => $descripcion, 'tutor' => $tutor]);
        $message = new AMQPMessage($messageBody);
        $channel->basic_publish($message, '', 'facility_created');

        
        $channel->close();
        $connection->close();

        
        header('Content-Type: application/json');
        echo json_encode($result);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}
