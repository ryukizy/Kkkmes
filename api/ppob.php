<?php
// ============================================
//  API/PPOB.PHP — KopKar MES
//  PPOB Transaction Handler (Example Implementation)
// ============================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database connection
require_once 'db.php';
require_once 'auth.php';

// Verify JWT token
$user = verifyToken();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ─── DIGIFLAZZ CONFIGURATION ───
define('DIGIFLAZZ_USERNAME', 'your_username');  // Ganti dengan username Anda
define('DIGIFLAZZ_API_KEY', 'your_api_key');    // Ganti dengan API key Anda
define('DIGIFLAZZ_ENDPOINT', 'https://api.digiflazz.com/v1/transaction');
define('DIGIFLAZZ_PRICE_CHECK', 'https://api.digiflazz.com/v1/price-list');

// ─── GET PRODUCT LIST ───
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? 'all';
    
    try {
        // Generate signature for Digiflazz
        $sign = md5(DIGIFLAZZ_USERNAME . DIGIFLAZZ_API_KEY . 'pricelist');
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => DIGIFLAZZ_PRICE_CHECK,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'cmd' => 'prepaid',
                'username' => DIGIFLAZZ_USERNAME,
                'sign' => $sign
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $data = json_decode($response, true);
            
            // Filter by category if needed
            if ($category !== 'all') {
                $data['data'] = array_filter($data['data'], function($item) use ($category) {
                    return stripos($item['category'], $category) !== false;
                });
            }
            
            echo json_encode([
                'success' => true,
                'products' => $data['data']
            ]);
        } else {
            throw new Exception('Failed to fetch products');
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to get product list',
            'message' => $e->getMessage()
        ]);
    }
    exit;
}

// ─── PROCESS TRANSACTION ───
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $nik = $user['nik'];
    $productCode = $input['product_code'] ?? '';
    $customerNo = $input['customer_no'] ?? ''; // Phone or PLN ID
    $paymentMethod = $input['payment_method'] ?? 'simpanan_sukarela';
    
    // Validation
    if (empty($productCode) || empty($customerNo)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields']);
        exit;
    }
    
    try {
        // Begin transaction
        $db->beginTransaction();
        
        // 1. Get product price from our database (synced from Digiflazz)
        $stmt = $db->prepare("
            SELECT * FROM ppob_products 
            WHERE product_code = ? AND status = 'active'
        ");
        $stmt->execute([$productCode]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$product) {
            throw new Exception('Product not found');
        }
        
        $totalAmount = $product['price'] + $product['admin_fee'];
        
        // 2. Check balance
        if ($paymentMethod === 'simpanan_sukarela') {
            $stmt = $db->prepare("
                SELECT sukarela FROM simpanan WHERE nik = ?
            ");
            $stmt->execute([$nik]);
            $simpanan = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$simpanan || $simpanan['sukarela'] < $totalAmount) {
                throw new Exception('Insufficient balance');
            }
        } else if ($paymentMethod === 'limit_belanja') {
            // Check monthly limit
            $stmt = $db->prepare("
                SELECT COALESCE(SUM(total_amount), 0) as used_limit
                FROM ppob_transactions
                WHERE nik = ? 
                AND payment_method = 'limit_belanja'
                AND MONTH(created_at) = MONTH(CURRENT_DATE())
                AND YEAR(created_at) = YEAR(CURRENT_DATE())
            ");
            $stmt->execute([$nik]);
            $limitData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $monthlyLimit = 3000000; // Rp 3 juta
            if (($limitData['used_limit'] + $totalAmount) > $monthlyLimit) {
                throw new Exception('Monthly limit exceeded');
            }
        }
        
        // 3. Create transaction ID
        $trxId = 'PPOB-' . date('YmdHis') . '-' . substr(md5(random_bytes(10)), 0, 4);
        
        // 4. Insert pending transaction
        $stmt = $db->prepare("
            INSERT INTO ppob_transactions (
                id, nik, type, provider, product_code, 
                phone_number, customer_id, amount, admin_fee, 
                total_amount, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ");
        
        $type = $product['category'];
        $provider = $product['provider'];
        $phoneNumber = ($type === 'pln') ? null : $customerNo;
        $customerId = ($type === 'pln') ? $customerNo : null;
        
        $stmt->execute([
            $trxId, $nik, $type, $provider, $productCode,
            $phoneNumber, $customerId, $product['price'], 
            $product['admin_fee'], $totalAmount, $paymentMethod
        ]);
        
        // 5. Call Digiflazz API
        $sign = md5(DIGIFLAZZ_USERNAME . DIGIFLAZZ_API_KEY . $trxId);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => DIGIFLAZZ_ENDPOINT,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode([
                'username' => DIGIFLAZZ_USERNAME,
                'buyer_sku_code' => $productCode,
                'customer_no' => $customerNo,
                'ref_id' => $trxId,
                'sign' => $sign,
                'testing' => false // Set true for sandbox
            ]),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $apiResult = json_decode($response, true);
        
        // 6. Update transaction status
        if ($httpCode === 200 && isset($apiResult['data']['status'])) {
            $status = ($apiResult['data']['status'] === 'Sukses') ? 'success' : 'failed';
            $snToken = $apiResult['data']['sn'] ?? null;
            $apiTrxId = $apiResult['data']['trx_id'] ?? null;
            
            $stmt = $db->prepare("
                UPDATE ppob_transactions 
                SET status = ?, sn_token = ?, api_trx_id = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$status, $snToken, $apiTrxId, $trxId]);
            
            // 7. Deduct balance if success
            if ($status === 'success') {
                if ($paymentMethod === 'simpanan_sukarela') {
                    $stmt = $db->prepare("
                        UPDATE simpanan 
                        SET sukarela = sukarela - ? 
                        WHERE nik = ?
                    ");
                    $stmt->execute([$totalAmount, $nik]);
                }
                // For limit_belanja, the record in ppob_transactions already tracks usage
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'transaction_id' => $trxId,
                    'sn_token' => $snToken,
                    'message' => 'Transaction successful'
                ]);
            } else {
                $db->commit();
                
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Transaction failed',
                    'message' => $apiResult['data']['message'] ?? 'Unknown error'
                ]);
            }
        } else {
            // API call failed
            $stmt = $db->prepare("
                UPDATE ppob_transactions 
                SET status = 'failed', updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$trxId]);
            
            $db->commit();
            
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Provider API error',
                'details' => $apiResult
            ]);
        }
        
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        
        http_response_code(500);
        echo json_encode([
            'error' => $e->getMessage()
        ]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
