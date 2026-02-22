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

// Get JSON input
$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true) ?? [];

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
      'post' => $_POST,
      'json_input' => $jsonInput,
      'decoded_data' => $data,
      'content_type' => $_SERVER['CONTENT_TYPE'] ?? null
    ]
  ]);
  exit;
}

/** ✅ Put your REAL ClickSend credentials */
$username = 'locksinmacon@gmail.com';  // often your ClickSend login email
$apiKey   = '4CBE5079-AF82-D77A-8FE0-A559C2DA6B07d';   // API key / token from ClickSend
$to       = '+18335183268';

// Test response first
echo json_encode([
  'success' => true,
  'message' => 'Test: PHP file is working',
  'debug' => [
    'received_data' => $_POST,
    'name' => $name ?? 'not set',
    'email' => $email ?? 'not set',
    'phone' => $phone ?? 'not set',
    'message' => $message ?? 'not set'
  ]
]);
exit;

/** Keep sender simple for now (avoid sender-id rejection) */
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

/** Always return what ClickSend said (super useful for debugging) */
if ($status >= 200 && $status < 300) {
  echo json_encode(['success' => true, 'status' => $status, 'response' => $responseBody]);
  exit;
}

http_response_code(500);
echo json_encode([
  'success' => false,
  'message' => 'ClickSend rejected request',
  'status' => $status,
  'response' => $responseBody
]);