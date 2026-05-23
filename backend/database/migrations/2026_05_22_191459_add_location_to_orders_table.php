<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('customer_lat', 10, 7)->nullable()->after('address');
            $table->decimal('customer_lng', 10, 7)->nullable()->after('customer_lat');
            $table->decimal('rider_lat', 10, 7)->nullable()->after('customer_lng');
            $table->decimal('rider_lng', 10, 7)->nullable()->after('rider_lat');
            $table->timestamp('rider_location_updated_at')->nullable()->after('rider_lng');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['customer_lat', 'customer_lng', 'rider_lat', 'rider_lng', 'rider_location_updated_at']);
        });
    }
};
