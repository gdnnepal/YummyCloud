<?php
/**
 * CloudKitchen Installer
 * Upload backend to server, then open this file in browser: https://api.yourdomain.com/install.php
 * After installation, DELETE this file for security.
 */

if (file_exists(__DIR__ . '/../.env') && filesize(__DIR__ . '/../.env') > 100) {
    $installed = true;
} else {
    $installed = false;
}

$message = '';
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$installed) {
    $dbHost = trim($_POST['db_host'] ?? '127.0.0.1');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';
    $appUrl = rtrim(trim($_POST['app_url'] ?? ''), '/');
    $frontendUrl = rtrim(trim($_POST['frontend_url'] ?? ''), '/');
    $adminName = trim($_POST['admin_name'] ?? 'Admin');
    $adminPhone = trim($_POST['admin_phone'] ?? '');
    $adminPass = $_POST['admin_pass'] ?? 'password';
    $smsKey = trim($_POST['sms_key'] ?? '');

    // Test DB connection
    try {
        $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (Exception $e) {
        $message = "Database connection failed: " . $e->getMessage();
        goto render;
    }

    // Generate app key
    $appKey = 'base64:' . base64_encode(random_bytes(32));

    // Write .env
    $env = "APP_NAME=CloudKitchen
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_URL={$appUrl}

DB_CONNECTION=mysql
DB_HOST={$dbHost}
DB_PORT=3306
DB_DATABASE={$dbName}
DB_USERNAME={$dbUser}
DB_PASSWORD={$dbPass}

SESSION_DRIVER=database
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

SMS_API_KEY={$smsKey}
SMS_API_URL=https://spellcpaas.com/api/smsapi
SMS_CAMPAIGN=API
SMS_ROUTE_ID=SI_Alert

FRONTEND_URL={$frontendUrl}
";

    file_put_contents(__DIR__ . '/../.env', $env);

    // Run artisan commands
    $basePath = realpath(__DIR__ . '/..');
    $php = PHP_BINARY ?: 'php';

    exec("cd {$basePath} && {$php} artisan migrate --force 2>&1", $output1, $code1);
    exec("cd {$basePath} && {$php} artisan db:seed --force 2>&1", $output2, $code2);
    exec("cd {$basePath} && {$php} artisan storage:link --force 2>&1", $output3, $code3);
    exec("cd {$basePath} && {$php} artisan config:cache 2>&1", $output4, $code4);
    exec("cd {$basePath} && {$php} artisan route:cache 2>&1", $output5, $code5);

    // Create admin user if not seeded
    if ($adminPhone) {
        require __DIR__ . '/../vendor/autoload.php';
        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

        $existing = \App\Models\User::where('phone', $adminPhone)->first();
        if (!$existing) {
            \App\Models\User::create([
                'name' => $adminName,
                'phone' => $adminPhone,
                'password' => $adminPass,
                'role' => 'admin',
                'is_verified' => true,
            ]);
        }
    }

    $success = true;
    $message = "Installation complete! Please DELETE this file (install.php) for security.";
}

render:
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudKitchen Installer</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, sans-serif; background: #f9fafb; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px; max-width: 480px; width: 100%; }
        h1 { font-size: 24px; color: #1f2937; margin-bottom: 4px; }
        p.sub { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
        label { display: block; font-size: 12px; font-weight: 600; color: #4b5563; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        input { width: 100%; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 12px; font-size: 14px; margin-bottom: 16px; outline: none; }
        input:focus { border-color: #e23744; }
        button { width: 100%; background: #e23744; color: #fff; border: none; border-radius: 8px; padding: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        button:hover { background: #c62828; }
        .msg { padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
        .msg.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .msg.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .section { font-size: 13px; font-weight: 700; color: #9ca3af; margin: 20px 0 8px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    </style>
</head>
<body>
<div class="card">
    <h1>🍽️ CloudKitchen</h1>
    <p class="sub">Installation Wizard</p>

    <?php if ($installed && !$success): ?>
        <div class="msg success">Application is already installed. Delete this file for security.</div>
    <?php elseif ($message): ?>
        <div class="msg <?= $success ? 'success' : 'error' ?>"><?= htmlspecialchars($message) ?></div>
    <?php endif; ?>

    <?php if (!$installed && !$success): ?>
    <form method="POST">
        <div class="section">Database</div>
        <label>DB Host</label>
        <input name="db_host" value="localhost" required>
        <label>DB Name</label>
        <input name="db_name" placeholder="cloudkitchen" required>
        <label>DB Username</label>
        <input name="db_user" placeholder="root" required>
        <label>DB Password</label>
        <input name="db_pass" type="password">

        <div class="section">URLs</div>
        <label>API URL (this domain)</label>
        <input name="app_url" placeholder="https://api.yourdomain.com" required>
        <label>Frontend URL</label>
        <input name="frontend_url" placeholder="https://yourdomain.com" required>

        <div class="section">Admin Account</div>
        <label>Admin Name</label>
        <input name="admin_name" value="Admin" required>
        <label>Admin Phone (10 digits)</label>
        <input name="admin_phone" placeholder="98XXXXXXXX" required>
        <label>Admin Password</label>
        <input name="admin_pass" type="password" value="password" required>

        <div class="section">SMS (Optional)</div>
        <label>SMS API Key</label>
        <input name="sms_key" placeholder="Leave blank to skip">

        <button type="submit">Install CloudKitchen</button>
    </form>
    <?php endif; ?>
</div>
</body>
</html>
