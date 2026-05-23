<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    public function sendOtp(string $phone, string $code): bool
    {
        $appName = Setting::get('kitchen_name') ?: 'CloudKitchen';
        $message = "Your {$appName} verification code is: {$code}. Valid for 5 minutes.";
        return $this->send($phone, $message);
    }

    public function send(string $phone, string $message): bool
    {
        try {
            // Try DB settings first, fallback to config/env
            $key = Setting::get('sms_api_key') ?: config('services.sms.key');
            $url = config('services.sms.url', 'https://spellcpaas.com/api/smsapi');
            $campaign = Setting::get('sms_campaign') ?: config('services.sms.campaign', 'API');
            $routeId = Setting::get('sms_route_id') ?: config('services.sms.route_id', 'SI_Alert');

            if (!$key) {
                Log::warning("SMS: No API key configured");
                return false;
            }

            $response = Http::asForm()->post($url, [
                'key' => $key,
                'campaign' => $campaign,
                'routeid' => $routeId,
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
