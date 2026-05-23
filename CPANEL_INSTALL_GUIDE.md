# CloudKitchen - cPanel Installation Guide (Tested & Working)

## Prerequisites
- cPanel hosting with PHP 8.2+ and MySQL
- SSH/Terminal access in cPanel
- Domain pointed to cPanel (e.g. yourdomain.com)
- Git installed on server (most cPanel hosts have it)

## Final Structure
```
~/YummyCloud/                    ← Cloned repo (private, not web-accessible)
~/YummyCloud/backend/            ← Laravel app
~/public_html/                   ← Customer app (frontend dist files)
~/public_html/backend/           ← Symlink to ~/YummyCloud/backend/public/
~/public_html/admin/             ← Admin dashboard (admin dist files)
~/public_html/rider/             ← Rider app (rider dist files)
```

---

## Step 1: Prepare Builds Locally (On Your Computer)

### 1.1 Update .env files with your domain

**frontend/.env:**
```
VITE_API_URL=https://yourdomain.com/backend/api
VITE_ONESIGNAL_APP_ID=your-onesignal-id
```

**admin/.env:**
```
VITE_API_URL=https://yourdomain.com/backend/api
```

**rider/.env:**
```
VITE_API_URL=https://yourdomain.com/backend/api
```

### 1.2 Build all apps
```bash
cd frontend && npm run build
cd ../admin && npm run build
cd ../rider && npm run build
```

### 1.3 Push to GitHub (including dist folders)
```bash
git add .
git commit -m "Production build"
git push
```

---

## Step 2: Create Database in cPanel

1. Login to cPanel → **MySQL Databases**
2. Create database (e.g. `yourusername_cloudkitchen`)
3. Create user (e.g. `yourusername_ckuser`) with strong password
4. Add user to database → **ALL PRIVILEGES**
5. Note: database name, username, password

---

## Step 3: Clone & Setup Backend (cPanel Terminal)

Open cPanel → **Terminal** and run:

```bash
# Clone the repo
cd ~
git clone https://github.com/yourusername/YourRepo.git YummyCloud

# Install PHP dependencies
cd ~/YummyCloud/backend
curl -sS https://getcomposer.org/installer | php
php composer.phar install --no-dev --optimize-autoloader

# Set permissions
chmod -R 775 ~/YummyCloud/backend/storage
chmod -R 775 ~/YummyCloud/backend/bootstrap/cache
```

---

## Step 4: Create Symlink for Backend

```bash
# Remove existing backend folder if any
rm -rf ~/public_html/backend

# Create symlink (exposes only the public/ folder)
ln -s ~/YummyCloud/backend/public ~/public_html/backend
```

---

## Step 5: Run the Installer

1. Open browser: `https://yourdomain.com/backend/install.php`
2. Fill in:
   - **DB Host:** `localhost`
   - **DB Name:** your database name from Step 2
   - **DB Username:** your db user from Step 2
   - **DB Password:** your db password
   - **API URL:** `https://yourdomain.com/backend`
   - **Frontend URL:** `https://yourdomain.com`
   - **Admin Name:** Your name
   - **Admin Phone:** 10-digit phone number
   - **Admin Password:** Strong password
   - **SMS API Key:** Your SpellCPaaS key (or leave blank)
3. Click **Install**

---

## Step 6: Run Migrations & Setup

If installer shows error or migrations didn't run, do manually:

```bash
cd ~/YummyCloud/backend
php artisan migrate:fresh --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
```

### Reset admin password if needed:
```bash
cd ~/YummyCloud/backend
php artisan tinker --execute="App\Models\User::where('role','admin')->update(['password'=>bcrypt('yourpassword')]);"
```

---

## Step 7: Copy Frontend Files

```bash
# Customer app → public_html root
cp -r ~/YummyCloud/frontend/dist/* ~/public_html/

# Admin app
mkdir -p ~/public_html/admin
cp -r ~/YummyCloud/admin/dist/* ~/public_html/admin/

# Rider app
mkdir -p ~/public_html/rider
cp -r ~/YummyCloud/rider/dist/* ~/public_html/rider/
```

---

## Step 8: Create .htaccess Files (CRITICAL!)

These enable React Router to work on page refresh.

### Customer app (.htaccess in public_html/):
```bash
cat > ~/public_html/.htaccess << 'EOF'
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
EOF
```

### Admin (.htaccess in public_html/admin/):
```bash
cat > ~/public_html/admin/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
EOF
```

### Rider (.htaccess in public_html/rider/):
```bash
cat > ~/public_html/rider/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rider/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rider/index.html [L]
</IfModule>
EOF
```

---

## Step 9: Add SMS API Key

```bash
cd ~/YummyCloud/backend
echo "SMS_API_KEY=YOUR_SMS_KEY_HERE" >> .env
echo "SMS_API_URL=https://spellcpaas.com/api/smsapi" >> .env
echo "SMS_CAMPAIGN=API" >> .env
echo "SMS_ROUTE_ID=SI_Alert" >> .env
php artisan config:cache
```

Or set it from Admin Panel → Settings → SMS section.

---

## Step 10: Delete Installer & Verify

```bash
rm ~/YummyCloud/backend/public/install.php
```

### Test URLs:
- Customer: `https://yourdomain.com`
- Admin: `https://yourdomain.com/admin` (login with phone + password)
- Rider: `https://yourdomain.com/rider`
- API test: `https://yourdomain.com/backend/api/categories`

---

## Updating After Code Changes

When you make changes locally and push to GitHub:

```bash
cd ~/YummyCloud
git pull

# If backend changed:
cd backend
php artisan config:cache
php artisan route:cache

# If frontend changed (rebuild locally first, push dist):
cp -r ~/YummyCloud/frontend/dist/* ~/public_html/
cp -r ~/YummyCloud/admin/dist/* ~/public_html/admin/
cp -r ~/YummyCloud/rider/dist/* ~/public_html/rider/
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on page refresh | Check .htaccess files exist with proper line breaks |
| CSRF token mismatch | Remove `statefulApi()` from bootstrap/app.php |
| 500 Server Error | Check `~/YummyCloud/backend/storage/logs/laravel.log` |
| Images not showing | Run `php artisan storage:link` |
| SMS not working | Check SMS_API_KEY in .env or Admin Settings |
| Admin login fails | Reset password via terminal (see Step 6) |
| White screen | Check browser console for JS errors |
| CORS errors | Update `config/cors.php` → `allowed_origins => ['*']` |

---

## Security Checklist

- [x] Delete install.php after setup
- [x] Backend source code is outside public_html (only public/ exposed via symlink)
- [x] .env file not accessible from web
- [x] APP_DEBUG=false in production .env
- [ ] Enable SSL (Let's Encrypt via cPanel)
- [ ] Set strong admin password
- [ ] Regular database backups
