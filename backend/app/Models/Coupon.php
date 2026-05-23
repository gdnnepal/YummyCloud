<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'description', 'type', 'value', 'min_order',
        'max_discount', 'usage_limit', 'used_count', 'valid_from',
        'valid_until', 'is_active', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order' => 'decimal:2',
            'max_discount' => 'decimal:2',
            'is_active' => 'boolean',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }

    public function isValid(float $orderTotal): bool
    {
        if (!$this->is_active) return false;
        if ($this->valid_from && now()->lt($this->valid_from)) return false;
        if ($this->valid_until && now()->gt($this->valid_until)) return false;
        if ($this->usage_limit && $this->used_count >= $this->usage_limit) return false;
        if ($orderTotal < $this->min_order) return false;
        return true;
    }

    public function calculateDiscount(float $orderTotal): float
    {
        if ($this->type === 'percent') {
            $discount = $orderTotal * ($this->value / 100);
            if ($this->max_discount) {
                $discount = min($discount, $this->max_discount);
            }
            return round($discount, 2);
        }
        return min($this->value, $orderTotal);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
