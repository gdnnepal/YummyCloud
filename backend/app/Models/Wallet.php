<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    protected $fillable = ['user_id', 'balance'];

    protected function casts(): array
    {
        return ['balance' => 'decimal:2'];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function credit(float $amount, string $title, ?string $description = null, ?int $orderId = null): void
    {
        $this->increment('balance', $amount);
        $this->transactions()->create([
            'type' => 'credit',
            'amount' => $amount,
            'title' => $title,
            'description' => $description,
            'order_id' => $orderId,
        ]);
    }

    public function debit(float $amount, string $title, ?string $description = null, ?int $orderId = null): bool
    {
        if ($this->balance < $amount) return false;
        $this->decrement('balance', $amount);
        $this->transactions()->create([
            'type' => 'debit',
            'amount' => $amount,
            'title' => $title,
            'description' => $description,
            'order_id' => $orderId,
        ]);
        return true;
    }
}
