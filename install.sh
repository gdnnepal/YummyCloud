#!/bin/bash
# YummyCloud Installer - Run from SSH terminal
# Usage: bash install.sh

echo "======================================"
echo "   YummyCloud - Food Delivery Setup"
echo "======================================"
echo ""

# Collect details
read -p "Store/Kitchen Name: " KITCHEN_NAME
read -p "Domain (with https://): " DOMAIN
read -p "DB Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}
read -p "DB Name: " DB_NAME
read -p "DB Username: " DB_USER
read -sp "DB Password: " DB_PASS
echo ""
read -p "Admin Name: " ADMIN_NAME
read -p "Admin Phone (10 digits): " ADMIN_PHONE
read -sp "Admin Password: " ADMIN_PASS
echo ""
read -p "License Key: " LICENSE_KEY
echo ""

HOME_DIR=$(eval echo ~)
REPO_DIR="$HOME_DIR/YummyCloud"
BACKEND_DIR="$REPO_DIR/backend"
PUBLIC_HTML="$HOME_DIR/public_html"

echo "[1/11] Cloning repository..."
if [ -d "$REPO_DIR/.git" ]; then
    cd "$REPO_DIR" && git checkout -- . && git pull
elif [ -d "$REPO_DIR" ]; then
    rm -rf "$REPO_DIR"
    cd "$HOME_DIR" && git clone https://github.com/justbishwash/YummyCloud.git YummyCloud
else
    cd "$HOME_DIR" && git clone https://github.com/justbishwash/YummyCloud.git YummyCloud
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo "ERROR: Clone failed. Check git access."
    exit 1
fi

echo "[2/11] Creating .env..."
APP_KEY=$(openssl rand -base64 32)
cat > "$BACKEND_DIR/.env" << EOF
APP_NAME="$KITCHEN_NAME"
APP_ENV=production
APP_KEY=base64:$APP_KEY
APP_DEBUG=false
APP_TIMEZONE=Asia/Kathmandu
APP_URL=$DOMAIN/backend
APP_INSTALLED=true

DB_CONNECTION=mysql
DB_HOST=$DB_HOST
DB_PORT=3306
DB_DATABASE=$DB_NAME
DB_USERNAME=$DB_USER
DB_PASSWORD=$DB_PASS

SESSION_DRIVER=database
BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_STORE=database

FRONTEND_URL=$DOMAIN

SMS_API_URL=https://spellcpaas.com/api/smsapi
SMS_API_KEY=
SMS_CAMPAIGN=API
SMS_ROUTE_ID=SI_Alert

ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
EOF

echo "[3/11] Installing Composer..."
cd "$BACKEND_DIR"
if [ ! -f "vendor/autoload.php" ]; then
    curl -sS https://getcomposer.org/installer | php
    php composer.phar install --no-dev --optimize-autoloader
fi

echo "[4/11] Running migrations..."
php artisan migrate --force

echo "[5/11] Creating admin user..."
php artisan tinker --execute="\$u = \App\Models\User::updateOrCreate(['phone'=>'$ADMIN_PHONE'],['name'=>'$ADMIN_NAME','phone'=>'$ADMIN_PHONE','password'=>bcrypt('$ADMIN_PASS'),'role'=>'admin','is_verified'=>true]); \App\Models\Wallet::firstOrCreate(['user_id'=>\$u->id],['balance'=>0]);"

echo "[6/11] Setting kitchen name..."
php artisan tinker --execute="\App\Models\Setting::set('kitchen_name','$KITCHEN_NAME');"

echo "[7/11] Verifying license..."
if [ -n "$LICENSE_KEY" ]; then
    php artisan tinker --execute="\App\Models\Setting::set('license_key','$LICENSE_KEY');"
    LICENSE_RESULT=$(curl -s -X POST https://license.gdn.com.np/api/verify \
        -H "Content-Type: application/json" \
        -d "{\"license_key\":\"$LICENSE_KEY\",\"product_slug\":\"yummycloud\",\"domain\":\"$(echo $DOMAIN | sed 's|https://||;s|http://||;s|/.*||')\",\"timestamp\":$(date +%s)}")
    if echo "$LICENSE_RESULT" | grep -q '"status":"valid"'; then
        echo "   ✓ License activated successfully!"
        php artisan tinker --execute="\App\Models\Setting::set('license_valid','true');"
    else
        echo "   ⚠ License verification failed. You can activate later from Admin > Settings > License."
        php artisan tinker --execute="\App\Models\Setting::set('license_valid','false');"
    fi
else
    echo "   ⚠ No license key provided. Activate later from Admin > Settings > License."
fi

echo "[8/11] Creating symlinks..."
php artisan storage:link
rm -rf "$PUBLIC_HTML/backend"
ln -s "$BACKEND_DIR/public" "$PUBLIC_HTML/backend"

echo "[9/11] Copying frontend files..."
cp -r "$REPO_DIR/frontend/dist/"* "$PUBLIC_HTML/"
mkdir -p "$PUBLIC_HTML/admin"
cp -r "$REPO_DIR/admin/dist/"* "$PUBLIC_HTML/admin/"
mkdir -p "$PUBLIC_HTML/rider"
cp -r "$REPO_DIR/rider/dist/"* "$PUBLIC_HTML/rider/"

echo "[10/11] Creating .htaccess files..."
cat > "$PUBLIC_HTML/.htaccess" << 'HTEOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^backend/ - [L]
  RewriteRule ^admin/ - [L]
  RewriteRule ^rider/ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
HTEOF

cat > "$PUBLIC_HTML/admin/.htaccess" << 'HTEOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
HTEOF

cat > "$PUBLIC_HTML/rider/.htaccess" << 'HTEOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rider/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rider/index.html [L]
</IfModule>
HTEOF

echo "[11/11] Caching & permissions..."
cd "$BACKEND_DIR"
php artisan config:cache
php artisan route:cache
chmod -R 775 storage bootstrap/cache

echo ""
echo "======================================"
echo "   Installation Complete!"
echo "======================================"
echo ""
echo "Customer App: $DOMAIN"
echo "Admin Panel:  $DOMAIN/admin"
echo "Rider App:    $DOMAIN/rider"
echo ""
echo "Admin Login:  $ADMIN_PHONE / your password"
echo ""
echo "Done! Delete install.sh from public_html if present."
