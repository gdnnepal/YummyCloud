<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'order_number', 'status', 'subtotal', 'discount',
        'wallet_deduction', 'delivery_fee', 'total', 'payment_method', 'payment_status',
        'payment_screenshot', 'coupon_code', 'address', 'customer_lat', 'customer_lng',
        'rider_lat', 'rider_lng', 'rider_location_updated_at', 'note',
        'delivery_partner_id', 'estimated_delivery_at', 'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'estimated_delivery_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function deliveryPartner()
    {
        return $this->belongsTo(User::class, 'delivery_partner_id');
    }

    public function rating()
    {
        return $this->hasOne(Rating::class);
    }

    public function logs()
    {
        return $this->hasMany(OrderLog::class)->orderBy('created_at');
    }

    public static function generateOrderNumber(): string
    {
        return 'CK' . date('ymd') . strtoupper(substr(uniqid(), -4));
    }
}
