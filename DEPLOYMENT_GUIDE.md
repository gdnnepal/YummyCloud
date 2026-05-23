# CloudKitchen - cPanel Deployment Guide

## Overview

This guide will help you deploy CloudKitchen to a cPanel hosting with:
- Customer App → yourdomain.com
- Admin Dashboard → yourdomain.com/admin
- Rider App → yourdomain.com/rider
- Backend API → api.yourdomain.com

---

## Prerequisites

- cPanel hosting with PHP 8.2+ and MySQL
- A domain name with DNS access
- Node.js installed on your LOCAL machine (for building)
- SSL certificate (most cPanel hosts provide free Let's Encrypt)

---

## Step 1: Build Frontend Apps (On Your Local Machine)

### 1.1 Update API URLs

Edit these files and set your production API URL:

**frontend/.env**
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_ONESIGNAL_APP_ID=your-onesignal-app-id
```

**admin/.env**
```
VITE_API_URL=https://api.yourdomain.com/api
```

**rider/.env**
```
VITE_API_URL=https://api.yourdomain.com/api
```

### 1.2 Build All Three Apps

Run these commands in your local terminal:

```bash
cd frontend
npm run build

cd ../admin
npm run build

cd ../rider
npm run build
```

This creates `dist/` folders in each app with production-ready static files.

---

## Step 2: Create Database on cPanel

1. Login to cPanel
2. Go to **MySQL Databases**
3. Create a new database (e.g., `cloudkitchen`)
4. Create a new user (e.g., `ck_user`) with a strong password
5. Add user to database with **ALL PRIVILEGES**
6. Note down: database name, username, password

---

## Step 3: Create Subdomain for API

1. In cPanel, go to **Domains** or **Subdomains**
2. Create subdomain: `api.yourdomain.com`
3. Set document root to: `/home/yourusername/backend/public`
   (We'll upload the backend here in the next step)
4. Enable SSL for this subdomain (Let's Encrypt)

---

## Step 4: Upload Backend (Laravel)

### 4.1 Prepare Backend Files

From your local `backend/` folder, you need to upload EVERYTHING except:
- `node_modules/` (skip)
- `.env` (will be created by installer)
- `storage/logs/*.log` (skip)

### 4.2 Upload via File Manager or FTP

Upload the entire `backend/` folder to:
```
/home/yourusername/backend/
```

Your structure should look like:
```
/home/yourusername/backend/
├── app/
├── bootstrap/
├── config/
├── database/
├── public/
│   ├── index.php
│   ├── install.php    ← The installer
│   └── .htaccess
├── resources/
├── routes/
├── storage/
├── vendor/
├── artisan
├── composer.json
└── ...
```

### 4.3 Set Permissions

In cPanel Terminal or via File Manager, set these permissions:
```bash
chmod -R 775 /home/yourusername/backend/storage
chmod -R 775 /home/yourusername/backend/bootstrap/cache
```

---

## Step 5: Run the Installer

1. Open in browser: `https://api.yourdomain.com/install.php`
2. Fill in:
   - **DB Host**: `localhost`
   - **DB Name**: your database name from Step 2
   - **DB Username**: your db user from Step 2
   - **DB Password**: your db password from Step 2
   - **API URL**: `https://api.yourdomain.com`
   - **Frontend URL**: `https://yourdomain.com`
   - **Admin Name**: Your name
   - **Admin Phone**: Your 10-digit phone (for login)
   - **Admin Password**: Choose a strong password
   - **SMS API Key**: Your SpellCPaaS key (optional)
3. Click **Install CloudKitchen**
4. **DELETE install.php** after successful installation!

---

## Step 6: Upload Frontend Apps

### 6.1 Customer App

Upload ALL files from `frontend/dist/` to:
```
/home/yourusername/public_html/
```

Files to upload:
```
public_html/
├── index.html
├── manifest.json
├── sw.js
├── favicon.svg
├── assets/
│   ├── index-xxxxx.css
│   └── index-xxxxx.js
└── .htaccess (create this - see below)
```

### 6.2 Admin Dashboard

Create folder `public_html/admin/` and upload ALL files from `admin/dist/` there:
```
public_html/admin/
├── index.html
├── assets/
│   ├── index-xxxxx.css
│   └── index-xxxxx.js
└── .htaccess (create this - see below)
```

### 6.3 Rider App

Create folder `public_html/rider/` and upload ALL files from `rider/dist/` there:
```
public_html/rider/
├── index.html
├── assets/
│   ├── index-xxxxx.css
│   └── index-xxxxx.js
└── .htaccess (create this - see below)
```

---

## Step 7: Create .htaccess Files (IMPORTANT!)

These are needed for React Router to work (SPA routing).

### public_html/.htaccess
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^admin/ - [L]
  RewriteRule ^rider/ - [L]
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### public_html/admin/.htaccess
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /admin/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /admin/index.html [L]
</IfModule>
```

### public_html/rider/.htaccess
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rider/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rider/index.html [L]
</IfModule>
```

---

## Step 8: Verify Everything Works

Test these URLs:
- Customer App: `https://yourdomain.com`
- Admin Login: `https://yourdomain.com/admin`
- Rider Login: `https://yourdomain.com/rider`
- API Health: `https://api.yourdomain.com/up`

Login to admin with the phone/password you set in the installer.

---

## Step 9: Post-Installation

### Storage Link (if images don't show)
In cPanel Terminal:
```bash
cd ~/backend
php artisan storage:link
```

### If you get 500 errors
Check `backend/storage/logs/laravel.log` for details.

### Clear cache after any backend changes
```bash
cd ~/backend
php artisan config:cache
php artisan route:cache
php artisan optimize
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| White page on frontend | Check .htaccess files exist |
| API returns 500 | Check storage/logs/laravel.log |
| CORS errors | Update backend/config/cors.php allowed_origins |
| Images not showing | Run `php artisan storage:link` |
| Login not working | Check DB connection in .env |
| SMS not sending | Verify SMS_API_KEY in admin Settings |

---

## URLs Summary

| App | URL | Login |
|-----|-----|-------|
| Customer | yourdomain.com | Register with phone |
| Admin | yourdomain.com/admin | Phone + password (set in installer) |
| Rider | yourdomain.com/rider | Created from admin panel |
| API | api.yourdomain.com | - |

---

## Security Checklist

- [ ] Delete `install.php` after installation
- [ ] Set `APP_DEBUG=false` in .env
- [ ] Enable SSL on all domains
- [ ] Set strong admin password
- [ ] Backup database regularly

---

## Need Help?

If you face any issues during deployment, check:
1. PHP version (must be 8.2+)
2. Required PHP extensions: BCMath, Ctype, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML
3. MySQL 5.7+ or MariaDB 10.3+
