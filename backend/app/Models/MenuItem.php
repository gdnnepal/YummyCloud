<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'category_id', 'name', 'name_ne', 'description', 'description_ne',
        'price', 'image', 'is_veg', 'is_available', 'is_featured', 'is_reward',
        'rating', 'rating_count', 'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'rating' => 'decimal:1',
            'is_veg' => 'boolean',
            'is_available' => 'boolean',
            'is_featured' => 'boolean',
            'is_reward' => 'boolean',
        ];
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
