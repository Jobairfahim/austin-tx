<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
  exit;
}

/* ✅ Support BOTH JSON body and normal form POST */
$raw  = file_get_contents('php://input');
$json = json_decode($raw, true);
if (!is_array($json)) $json = [];

$data = array_merge($_POST, $json);

$name    = trim($data['name'] ?? '');
$email   = trim($data['email'] ?? '');
$phone   = trim($data['phone'] ?? '');
$message = trim($data['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
  http_response_code(400);
  echo json_encode([
    'success' => false,
    'message' => 'Missing required fields',
    'debug' => [
      'content_type' => $_SERVER['CONTENT_TYPE'] ?? null,
      'received_keys' => array_keys($data),
      'post' => $_POST,
      'json' => $json
    ]
  ]);
  exit;
}

/**
 * ✅ SECURITY NOTE:
 * You exposed your API key in chat. Rotate it in ClickSend and replace below.
 * Better: put creds in env vars if your hosting supports it.
 */
$username = 'locksinmacon@gmail.com';
$apiKey   = 'REPLACE_WITH_NEW_CLICKSEND_API_KEY';
$to       = '+18335183268';

$payload = [
  'messages' => [[
    'source' => 'php',
    'to' => $to,
    'body' => "New message:\nName: {$name}\nEmail: {$email}\nPhone: {$phone}\nMessage: {$message}"
  ]]
];

$ch = curl_init('https://rest.clicksend.com/v3/sms/send');
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
  CURLOPT_POSTFIELDS => json_encode($payload),
  CURLOPT_USERPWD => $username . ':' . $apiKey,
  CURLOPT_TIMEOUT => 30,
]);

$responseBody = curl_exec($ch);
$curlErr = curl_error($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($responseBody === false) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'cURL failed', 'error' => $curlErr]);
  exit;
}

if ($status >= 200 && $status < 300) {
  echo json_encode([
    'success' => true,
    'status' => $status,
    'response' => json_decode($responseBody, true) ?? $responseBody
  ]);
  exit;
}

http_response_code(500);
echo json_encode([
  'success' => false,
  'message' => 'ClickSend rejected request',
  'status' => $status,
  'response' => $responseBody
]);