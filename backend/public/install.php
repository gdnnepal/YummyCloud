<?php
/**
 * YummyCloud Installer
 * Upload this file to your public_html/backend/ directory and open in browser.
 * It will clone the repo, install dependencies, and set up everything.
 */

// Prevent re-installation
if (file_exists(__DIR__ . '/../.env') && file_exists(__DIR__ . '/../vendor/autoload.php')) {
    $env = file_get_contents(__DIR__ . '/../.env');
    if (strpos($env, 'APP_INSTALLED=true') !== false) {
        die('<h2>Application is already installed.</h2><p>Delete this file for security.</p>');
    }
}

$errors = [];
$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dbHost = trim($_POST['db_host'] ?? 'localhost');
    $dbName = trim($_POST['db_name'] ?? '');
    $dbUser = trim($_POST['db_user'] ?? '');
    $dbPass = $_POST['db_pass'] ?? '';
    $domain = rtrim(trim($_POST['domain'] ?? ''), '/');
    $adminName = trim($_POST['admin_name'] ?? '');
    $adminPhone = trim($_POST['admin_phone'] ?? '');
    $adminPassword = $_POST['admin_password'] ?? '';
    $kitchenName = trim($_POST['kitchen_name'] ?? 'Yummy Cloud');

    // Validate
    if (!$dbName) $errors[] = 'Database name is required';
    if (!$dbUser) $errors[] = 'Database username is required';
    if (!$domain) $errors[] = 'Domain is required';
    if (!$adminPhone || strlen($adminPhone) !== 10) $errors[] = 'Admin phone must be 10 digits';
    if (!$adminPassword || strlen($adminPassword) < 6) $errors[] = 'Admin password must be at least 6 characters';

    if (empty($errors)) {
        // Test DB connection
        try {
            $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            $errors[] = 'Database connection failed: ' . $e->getMessage();
        }
    }

    if (empty($errors)) {
        $homeDir = dirname(dirname(dirname(__DIR__))); // ~/
        $repoDir = $homeDir . '/YummyCloud';
        $backendDir = $repoDir . '/backend';
        $publicHtml = dirname(dirname(__DIR__)); // public_html

        // Step 1: Clone repo if not exists
        if (!is_dir($repoDir)) {
            exec("cd {$homeDir} && git clone https://github.com/justbishwash/YummyCloud.git YummyCloud 2>&1", $output, $code);
            if ($code !== 0) {
                $errors[] = 'Git clone failed: ' . implode("\n", $output);
            }
        } else {
            exec("cd {$repoDir} && git checkout -- . && git pull 2>&1", $output);
        }

        if (empty($errors)) {
            // Step 2: Create .env
            $envContent = "APP_NAME={$kitchenName}
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL={$domain}/backend
APP_INSTALLED=true

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

FRONTEND_URL={$domain}
";
            file_put_contents($backendDir . '/.env', $envContent);

            // Step 3: Install composer
            if (!file_exists($backendDir . '/vendor/autoload.php')) {
                exec("cd {$backendDir} && curl -sS https://getcomposer.org/installer | php 2>&1");
                exec("cd {$backendDir} && php composer.phar install --no-dev --optimize-autoloader 2>&1", $composerOutput, $composerCode);
                if ($composerCode !== 0) {
                    $errors[] = 'Composer install failed';
                }
            }

            // Step 4: Generate key
            exec("cd {$backendDir} && php artisan key:generate --force 2>&1");

            // Step 5: Run migrations
            exec("cd {$backendDir} && php artisan migrate --force 2>&1", $migrateOutput, $migrateCode);

            // Step 6: Create admin user
            exec("cd {$backendDir} && php artisan tinker --execute=\"\$u = App\\Models\\User::updateOrCreate(['phone' => '{$adminPhone}'], ['name' => '{$adminName}', 'phone' => '{$adminPhone}', 'password' => bcrypt('{$adminPassword}'), 'role' => 'admin', 'is_verified' => true]); App\\Models\\Wallet::firstOrCreate(['user_id' => \$u->id], ['balance' => 0]);\" 2>&1");

            // Step 7: Set kitchen name
            exec("cd {$backendDir} && php artisan tinker --execute=\"App\\Models\\Setting::set('kitchen_name', '{$kitchenName}');\" 2>&1");

            // Step 7b: Verify and store license key
            $licenseKey = trim($_POST['license_key'] ?? '');
            if ($licenseKey) {
                exec("cd {$backendDir} && php artisan tinker --execute=\"App\\Models\\Setting::set('license_key', '{$licenseKey}');\" 2>&1");
                $domain = parse_url($domain, PHP_URL_HOST);
                $licensePayload = json_encode([
                    'license_key' => $licenseKey,
                    'product_slug' => 'yummycloud',
                    'domain' => $domain,
                ]);
                $ch = curl_init('https://license.gdn.com.np/api/verify');
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $licensePayload,
                    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 10,
                ]);
                $licenseResponse = curl_exec($ch);
                curl_close($ch);
                $licenseData = json_decode($licenseResponse, true);
                $licenseValid = ($licenseData['valid'] ?? false) ? 'true' : 'false';
                exec("cd {$backendDir} && php artisan tinker --execute=\"App\\Models\\Setting::set('license_valid', '{$licenseValid}');\" 2>&1");
            }

            // Step 8: Storage link
            exec("cd {$backendDir} && php artisan storage:link 2>&1");

            // Step 9: Create symlink for backend
            $backendPublic = $backendDir . '/public';
            $backendLink = $publicHtml . '/backend';
            if (!is_link($backendLink) && !is_dir($backendLink)) {
                symlink($backendPublic, $backendLink);
            }

            // Step 10: Copy frontend dist files
            exec("cp -r {$repoDir}/frontend/dist/* {$publicHtml}/ 2>&1");
            exec("mkdir -p {$publicHtml}/admin && cp -r {$repoDir}/admin/dist/* {$publicHtml}/admin/ 2>&1");
            exec("mkdir -p {$publicHtml}/rider && cp -r {$repoDir}/rider/dist/* {$publicHtml}/rider/ 2>&1");

            // Step 11: Create .htaccess files
            file_put_contents($publicHtml . '/.htaccess', '<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^backend/ - [L]
  RewriteRule ^admin/ - [L]
  RewriteRule ^rider/ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>');

            file_put_contents($publicHtml . '/admin/.htaccess', '<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>');

            file_put_contents($publicHtml . '/rider/.htaccess', '<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rider/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rider/index.html [L]
</IfModule>');

            // Step 12: Cache
            exec("cd {$backendDir} && php artisan config:cache && php artisan route:cache 2>&1");

            // Step 13: Set permissions
            exec("chmod -R 775 {$backendDir}/storage {$backendDir}/bootstrap/cache 2>&1");

            $success = true;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install YummyCloud</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .card { background: white; border-radius: 16px; padding: 40px; max-width: 500px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        h1 { font-size: 24px; color: #1a1a1a; margin-bottom: 8px; }
        p.sub { color: #666; font-size: 14px; margin-bottom: 24px; }
        label { display: block; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; margin-top: 16px; }
        input { width: 100%; padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 10px; font-size: 14px; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #e23744; }
        button { width: 100%; padding: 14px; background: #e23744; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 24px; }
        button:hover { background: #c62828; }
        .error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
        .success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #16a34a; padding: 16px; border-radius: 8px; font-size: 14px; text-align: center; }
        .success a { color: #e23744; font-weight: 600; text-decoration: none; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    </style>
</head>
<body>
<div class="card">
    <?php if ($success): ?>
        <div class="success">
            <h2 style="margin-bottom:12px;">Installation Complete!</h2>
            <p>Your app is ready.</p>
            <p style="margin-top:16px;">
                <a href="<?= $domain ?>">Customer App</a> &bull;
                <a href="<?= $domain ?>/admin">Admin Panel</a> &bull;
                <a href="<?= $domain ?>/rider">Rider App</a>
            </p>
            <p style="margin-top:12px;font-size:12px;color:#666;">Admin: <?= $adminPhone ?> / your password</p>
            <p style="margin-top:16px;font-size:11px;color:#999;">Delete this install.php file for security!</p>
        </div>
    <?php else: ?>
        <h1>Install YummyCloud</h1>
        <p class="sub">Fill in the details below to set up your food delivery system.</p>

        <?php if (!empty($errors)): ?>
            <div class="error">
                <?php foreach ($errors as $e): ?>
                    <p>&bull; <?= htmlspecialchars($e) ?></p>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <form method="POST">
            <label>Kitchen / Store Name</label>
            <input type="text" name="kitchen_name" value="<?= htmlspecialchars($_POST['kitchen_name'] ?? '') ?>" placeholder="e.g. Yummy Tummy" required>

            <label>Your Domain (with https://)</label>
            <input type="url" name="domain" value="<?= htmlspecialchars($_POST['domain'] ?? '') ?>" placeholder="https://yourdomain.com" required>

            <div class="grid">
                <div>
                    <label>DB Host</label>
                    <input type="text" name="db_host" value="<?= htmlspecialchars($_POST['db_host'] ?? 'localhost') ?>">
                </div>
                <div>
                    <label>DB Name</label>
                    <input type="text" name="db_name" value="<?= htmlspecialchars($_POST['db_name'] ?? '') ?>" required>
                </div>
            </div>
            <div class="grid">
                <div>
                    <label>DB Username</label>
                    <input type="text" name="db_user" value="<?= htmlspecialchars($_POST['db_user'] ?? '') ?>" required>
                </div>
                <div>
                    <label>DB Password</label>
                    <input type="password" name="db_pass" value="<?= htmlspecialchars($_POST['db_pass'] ?? '') ?>">
                </div>
            </div>

            <label>Admin Name</label>
            <input type="text" name="admin_name" value="<?= htmlspecialchars($_POST['admin_name'] ?? '') ?>" placeholder="Your name" required>

            <div class="grid">
                <div>
                    <label>Admin Phone (10 digits)</label>
                    <input type="tel" name="admin_phone" value="<?= htmlspecialchars($_POST['admin_phone'] ?? '') ?>" placeholder="9800000000" maxlength="10" required>
                </div>
                <div>
                    <label>Admin Password</label>
                    <input type="password" name="admin_password" placeholder="Min 6 chars" required>
                </div>
            </div>

            <label>License Key</label>
            <input type="text" name="license_key" value="<?= htmlspecialchars($_POST['license_key'] ?? '') ?>" placeholder="XXXX-XXXX-XXXX-XXXX" style="font-family: monospace;">

            <button type="submit">Install Now</button>
        </form>
    <?php endif; ?>
</div>
</body>
</html>
