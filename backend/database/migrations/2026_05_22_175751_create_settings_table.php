<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default settings
        $defaults = [
            ['key' => 'kitchen_name', 'value' => 'CloudKitchen'],
            ['key' => 'delivery_fee', 'value' => '0'],
            ['key' => 'welcome_bonus', 'value' => '100'],
            ['key' => 'sms_api_key', 'value' => ''],
            ['key' => 'sms_campaign', 'value' => 'API'],
            ['key' => 'sms_route_id', 'value' => 'SI_Alert'],
            ['key' => 'onesignal_app_id', 'value' => ''],
            ['key' => 'qr_payment_info', 'value' => 'Scan QR to pay'],
            ['key' => 'min_order_amount', 'value' => '0'],
            ['key' => 'estimated_delivery_time', 'value' => '25-30 min'],
            ['key' => 'kitchen_phone', 'value' => ''],
            ['key' => 'kitchen_address', 'value' => ''],
        ];

        foreach ($defaults as $setting) {
            \DB::table('settings')->insert(array_merge($setting, ['created_at' => now(), 'updated_at' => now()]));
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
