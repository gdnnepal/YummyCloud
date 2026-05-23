<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OtpCode extends Model
{
    protected $fillable = ['phone', 'code', 'purpose', 'is_used', 'expires_at'];

    protected function casts(): array
    {
        return [
            'is_used' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return now()->gt($this->expires_at);
    }

    public static function generate(string $phone, string $purpose = 'registration'): self
    {
        // Invalidate old codes
        self::where('phone', $phone)->where('purpose', $purpose)->delete();

        return self::create([
            'phone' => $phone,
            'code' => str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(5),
        ]);
    }

    public static function verify(string $phone, string $code, string $purpose = 'registration'): bool
    {
        $otp = self::where('phone', $phone)
            ->where('code', $code)
            ->where('purpose', $purpose)
            ->where('is_used', false)
            ->first();

        if (!$otp || $otp->isExpired()) return false;

        $otp->update(['is_used' => true]);
        return true;
    }
}
