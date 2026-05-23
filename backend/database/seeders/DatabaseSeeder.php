<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\MenuItem;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        $admin = User::create([
            'name' => 'Admin',
            'phone' => '9800000000',
            'password' => 'password',
            'role' => 'admin',
            'is_verified' => true,
        ]);
        Wallet::create(['user_id' => $admin->id]);

        // Delivery partner
        $delivery = User::create([
            'name' => 'Delivery Partner',
            'phone' => '9800000001',
            'password' => 'password',
            'role' => 'delivery_partner',
            'is_verified' => true,
        ]);
        Wallet::create(['user_id' => $delivery->id]);

        // Categories
        $momo = Category::create(['name' => 'Momo', 'name_ne' => 'मोमो', 'icon' => '🥟', 'sort_order' => 1]);
        $rice = Category::create(['name' => 'Rice', 'name_ne' => 'भात', 'icon' => '🍚', 'sort_order' => 2]);
        $noodles = Category::create(['name' => 'Noodles', 'name_ne' => 'चाउमिन', 'icon' => '🍜', 'sort_order' => 3]);
        $drinks = Category::create(['name' => 'Drinks', 'name_ne' => 'पेय', 'icon' => '🥤', 'sort_order' => 4]);
        $snacks = Category::create(['name' => 'Snacks', 'name_ne' => 'खाजा', 'icon' => '🍿', 'sort_order' => 5]);
        $desserts = Category::create(['name' => 'Desserts', 'name_ne' => 'मिठाई', 'icon' => '🍰', 'sort_order' => 6]);

        // Menu Items - Momo
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Chicken Momo (Steam)', 'name_ne' => 'चिकन मोमो (स्टीम)', 'price' => 180, 'is_veg' => false, 'is_featured' => true, 'rating' => 4.5, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Chicken Momo (Fried)', 'name_ne' => 'चिकन मोमो (फ्राइड)', 'price' => 200, 'is_veg' => false, 'sort_order' => 2]);
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Veg Momo', 'name_ne' => 'भेज मोमो', 'price' => 140, 'is_veg' => true, 'sort_order' => 3]);
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Buff Momo', 'name_ne' => 'बफ मोमो', 'price' => 160, 'is_veg' => false, 'is_featured' => true, 'rating' => 4.6, 'sort_order' => 4]);
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Paneer Momo', 'name_ne' => 'पनीर मोमो', 'price' => 180, 'is_veg' => true, 'sort_order' => 5]);
        MenuItem::create(['category_id' => $momo->id, 'name' => 'Jhol Momo', 'name_ne' => 'झोल मोमो', 'price' => 200, 'is_veg' => false, 'sort_order' => 6]);

        // Menu Items - Rice
        MenuItem::create(['category_id' => $rice->id, 'name' => 'Chicken Fried Rice', 'name_ne' => 'चिकन फ्राइड राइस', 'price' => 180, 'is_veg' => false, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $rice->id, 'name' => 'Veg Fried Rice', 'name_ne' => 'भेज फ्राइड राइस', 'price' => 150, 'is_veg' => true, 'is_featured' => true, 'rating' => 4.2, 'sort_order' => 2]);
        MenuItem::create(['category_id' => $rice->id, 'name' => 'Egg Fried Rice', 'name_ne' => 'एग फ्राइड राइस', 'price' => 160, 'is_veg' => false, 'sort_order' => 3]);
        MenuItem::create(['category_id' => $rice->id, 'name' => 'Chicken Biryani', 'name_ne' => 'चिकन बिरयानी', 'price' => 250, 'is_veg' => false, 'sort_order' => 4]);

        // Menu Items - Noodles
        MenuItem::create(['category_id' => $noodles->id, 'name' => 'Veg Chowmein', 'name_ne' => 'भेज चाउमिन', 'price' => 120, 'is_veg' => true, 'is_featured' => true, 'rating' => 4.3, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $noodles->id, 'name' => 'Chicken Chowmein', 'name_ne' => 'चिकन चाउमिन', 'price' => 160, 'is_veg' => false, 'sort_order' => 2]);
        MenuItem::create(['category_id' => $noodles->id, 'name' => 'Buff Chowmein', 'name_ne' => 'बफ चाउमिन', 'price' => 150, 'is_veg' => false, 'sort_order' => 3]);
        MenuItem::create(['category_id' => $noodles->id, 'name' => 'Thukpa', 'name_ne' => 'थुक्पा', 'price' => 140, 'is_veg' => false, 'sort_order' => 4]);

        // Menu Items - Drinks
        MenuItem::create(['category_id' => $drinks->id, 'name' => 'Coke', 'name_ne' => 'कोक', 'price' => 60, 'is_veg' => true, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $drinks->id, 'name' => 'Lemon Soda', 'name_ne' => 'लेमन सोडा', 'price' => 50, 'is_veg' => true, 'sort_order' => 2]);
        MenuItem::create(['category_id' => $drinks->id, 'name' => 'Mango Lassi', 'name_ne' => 'म्यांगो लस्सी', 'price' => 80, 'is_veg' => true, 'sort_order' => 3]);
        MenuItem::create(['category_id' => $drinks->id, 'name' => 'Masala Tea', 'name_ne' => 'मसला चिया', 'price' => 40, 'is_veg' => true, 'sort_order' => 4]);

        // Menu Items - Snacks
        MenuItem::create(['category_id' => $snacks->id, 'name' => 'French Fries', 'name_ne' => 'फ्रेन्च फ्राइज', 'price' => 120, 'is_veg' => true, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $snacks->id, 'name' => 'Chicken Wings', 'name_ne' => 'चिकन विंग्स', 'price' => 220, 'is_veg' => false, 'sort_order' => 2]);
        MenuItem::create(['category_id' => $snacks->id, 'name' => 'Spring Roll', 'name_ne' => 'स्प्रिंग रोल', 'price' => 100, 'is_veg' => true, 'sort_order' => 3]);

        // Menu Items - Desserts
        MenuItem::create(['category_id' => $desserts->id, 'name' => 'Gulab Jamun', 'name_ne' => 'गुलाब जामुन', 'price' => 80, 'is_veg' => true, 'sort_order' => 1]);
        MenuItem::create(['category_id' => $desserts->id, 'name' => 'Rasgulla', 'name_ne' => 'रसगुल्ला', 'price' => 80, 'is_veg' => true, 'sort_order' => 2]);

        // Coupons
        Coupon::create([
            'code' => 'FIRST20',
            'description' => '20% off on first order',
            'type' => 'percent',
            'value' => 20,
            'max_discount' => 100,
            'min_order' => 200,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'SAVE10',
            'description' => '10% off on orders above Rs. 300',
            'type' => 'percent',
            'value' => 10,
            'max_discount' => 50,
            'min_order' => 300,
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'FLAT50',
            'description' => 'Flat Rs. 50 off',
            'type' => 'fixed',
            'value' => 50,
            'min_order' => 250,
            'is_active' => true,
        ]);
    }
}
