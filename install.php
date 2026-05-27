<?php
/**
 * YummyCloud Installer
 * Upload ONLY this file to your public_html/ directory and open in browser.
 * It will clone the repo, install everything, create symlinks, and set up the app.
 */

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
    $kitchenName = trim($_POST['kitchen_name'] ?? 'CloudKitchen');

    if (!$dbName) $errors[] = 'Database name is required';
    if (!$dbUser) $errors[] = 'Database username is required';
    if (!$domain) $errors[] = 'Domain is required';
    if (!$adminPhone || strlen($adminPhone) !== 10) $errors[] = 'Admin phone must be 10 digits';
    if (!$adminPassword || strlen($adminPassword) < 6) $errors[] = 'Admin password must be at least 6 characters';

    if (empty($errors)) {
        try {
            $pdo = new PDO("mysql:host={$dbHost};dbname={$dbName}", $dbUser, $dbPass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch (PDOException $e) {
            $errors[] = 'Database connection failed: ' . $e->getMessage();
        }
    }

    if (empty($errors)) {
        $publicHtml = __DIR__;
        $homeDir = dirname($publicHtml);
        $repoDir = $homeDir . '/YummyCloud';
        $backendDir = $repoDir . '/backend';

        // Step 1: Clone repo
        if (!is_dir($repoDir)) {
            exec("cd {$homeDir} && git clone https://github.com/justbishwash/YummyCloud.git YummyCloud 2>&1", $cloneOutput, $cloneCode);
            if ($cloneCode !== 0) {
                $errors[] = 'Git clone failed. Make sure git is installed. Output: ' . implode(' ', $cloneOutput);
            }
        } else {
            exec("cd {$repoDir} && git checkout -- . && git pull 2>&1");
        }

        if (empty($errors)) {
            // Step 2: Create .env
            $appKey = 'base64:' . base64_encode(random_bytes(32));
            $envContent = "APP_NAME=\"{$kitchenName}\"
APP_ENV=production
APP_KEY={$appKey}
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
                exec("cd {$backendDir} && php composer.phar install --no-dev --optimize-autoloader 2>&1", $cOut, $cCode);
                if ($cCode !== 0) $errors[] = 'Composer install failed';
            }
        }

        if (empty($errors)) {
            // Step 4: Migrations
            exec("cd {$backendDir} && php artisan migrate --force 2>&1");

            // Step 5: Create admin
            $escapedPass = addslashes($adminPassword);
            exec("cd {$backendDir} && php artisan tinker --execute=\"\\App\\Models\\User::updateOrCreate(['phone'=>'{$adminPhone}'],['name'=>'{$adminName}','phone'=>'{$adminPhone}','password'=>bcrypt('{$escapedPass}'),'role'=>'admin','is_verified'=>true]); \\App\\Models\\Wallet::firstOrCreate(['user_id'=>\\App\\Models\\User::where('phone','{$adminPhone}')->first()->id],['balance'=>0]);\" 2>&1");

            // Step 6: Set kitchen name
            exec("cd {$backendDir} && php artisan tinker --execute=\"\\App\\Models\\Setting::set('kitchen_name','{$kitchenName}');\" 2>&1");

            // Step 7: Storage link
            exec("cd {$backendDir} && php artisan storage:link 2>&1");

            // Step 8: Create backend symlink
            $backendLink = $publicHtml . '/backend';
            if (is_dir($backendLink) && !is_link($backendLink)) {
                exec("rm -rf {$backendLink}");
            }
            if (!is_link($backendLink)) {
                symlink($backendDir . '/public', $backendLink);
            }

            // Step 9: Copy frontend files
            exec("cp -r {$repoDir}/frontend/dist/* {$publicHtml}/ 2>&1");
            exec("mkdir -p {$publicHtml}/admin && cp -r {$repoDir}/admin/dist/* {$publicHtml}/admin/ 2>&1");
            exec("mkdir -p {$publicHtml}/rider && cp -r {$repoDir}/rider/dist/* {$publicHtml}/rider/ 2>&1");

            // Step 10: .htaccess files
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

            // Step 11: Cache & permissions
            exec("cd {$backendDir} && php artisan config:cache && php artisan route:cache 2>&1");
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
    <title>Install</title>
    <style>
        *{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}.card{background:white;border-radius:16px;padding:40px;max-width:500px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.08)}h1{font-size:24px;color:#1a1a1a;margin-bottom:8px}p.sub{color:#666;font-size:14px;margin-bottom:24px}label{display:block;font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;margin-top:16px}input{width:100%;padding:12px 16px;border:1px solid #e0e0e0;border-radius:10px;font-size:14px;outline:none;transition:border-color 0.2s}input:focus{border-color:#e23744}button{width:100%;padding:14px;background:#e23744;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:24px}button:hover{background:#c62828}.error{background:#fef2f2;border:1px solid #fecaca;color:#dc2626;padding:12px;border-radius:8px;font-size:13px;margin-bottom:16px}.success{background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a;padding:20px;border-radius:8px;font-size:14px;text-align:center}.success a{color:#e23744;font-weight:600;text-decoration:none}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    </style>
</head>
<body>
<div class="card">
    <?php if ($success): ?>
        <div class="success">
            <h2 style="margin-bottom:12px;color:#1a1a1a">Installation Complete!</h2>
            <p style="margin-bottom:16px">Your food delivery system is ready.</p>
            <p><a href="<?=$domain?>">Customer App</a> &bull; <a href="<?=$domain?>/admin">Admin</a> &bull; <a href="<?=$domain?>/rider">Rider</a></p>
            <p style="margin-top:12px;font-size:12px;color:#666">Login: <?=$adminPhone?> / your password</p>
            <p style="margin-top:16px;font-size:11px;color:#e23744;font-weight:600">DELETE this install.php file now!</p>
        </div>
    <?php else: ?>
        <h1>Install App</h1>
        <p class="sub">Set up your food delivery system in one click.</p>
        <?php if(!empty($errors)):?><div class="error"><?php foreach($errors as $e):?><p>&bull; <?=htmlspecialchars($e)?></p><?php endforeach;?></div><?php endif;?>
        <form method="POST">
            <label>Store / Kitchen Name</label>
            <input type="text" name="kitchen_name" value="<?=htmlspecialchars($_POST['kitchen_name']??'')?>" placeholder="e.g. Yummy Tummy" required>
            <label>Domain (with https://)</label>
            <input type="url" name="domain" value="<?=htmlspecialchars($_POST['domain']??'')?>" placeholder="https://yourdomain.com" required>
            <div class="grid"><div><label>DB Host</label><input type="text" name="db_host" value="<?=htmlspecialchars($_POST['db_host']??'localhost')?>"></div><div><label>DB Name</label><input type="text" name="db_name" value="<?=htmlspecialchars($_POST['db_name']??'')?>" required></div></div>
            <div class="grid"><div><label>DB Username</label><input type="text" name="db_user" value="<?=htmlspecialchars($_POST['db_user']??'')?>" required></div><div><label>DB Password</label><input type="password" name="db_pass" value="<?=htmlspecialchars($_POST['db_pass']??'')?>"></div></div>
            <label>Admin Name</label>
            <input type="text" name="admin_name" value="<?=htmlspecialchars($_POST['admin_name']??'')?>" placeholder="Your name" required>
            <div class="grid"><div><label>Admin Phone (10 digits)</label><input type="tel" name="admin_phone" value="<?=htmlspecialchars($_POST['admin_phone']??'')?>" placeholder="9800000000" maxlength="10" required></div><div><label>Admin Password</label><input type="password" name="admin_password" placeholder="Min 6 chars" required></div></div>
            <button type="submit">Install Now</button>
        </form>
    <?php endif;?>
</div>
</body>
</html>
