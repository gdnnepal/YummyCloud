<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function sendOtp(string $phone, string $code): bool
    {
        $message = "Your CloudKitchen verification code is: {$code}. Valid for 5 minutes.";
        return $this->send($phone, $message);
    }

    public function send(string $phone, string $message): bool
    {
        try {
            $response = Http::asForm()->post(config('services.sms.url'), [
                'key' => config('services.sms.key'),
                'campaign' => config('services.sms.campaign'),
                'routeid' => config('services.sms.route_id'),
                'contacts' => $phone,
                'msg' => $message,
            ]);

            if ($response->successful()) {
                Log::info("SMS sent to {$phone}", ['response' => $response->body()]);
                return true;
            }

            Log::error("SMS failed to {$phone}: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("SMS exception: " . $e->getMessage());
            return false;
        }
    }
}
