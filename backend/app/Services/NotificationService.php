<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private function getAppId(): ?string
    {
        return Setting::get('onesignal_app_id') ?: config('services.onesignal.app_id');
    }

    private function getRestApiKey(): ?string
    {
        return Setting::get('onesignal_rest_api_key') ?: config('services.onesignal.rest_api_key');
    }

    /**
     * Send push notification to a specific user
     */
    public function sendToUser(int $userId, string $title, string $message, array $data = []): bool
    {
        return $this->send([
            'include_aliases' => ['external_id' => [strval($userId)]],
            'target_channel' => 'push',
        ], $title, $message, $data);
    }

    /**
     * Send push notification to all users
     */
    public function sendToAll(string $title, string $message, array $data = []): bool
    {
        return $this->send([
            'included_segments' => ['All'],
        ], $title, $message, $data);
    }

    private function send(array $target, string $title, string $message, array $data = []): bool
    {
        $appId = $this->getAppId();
        $apiKey = $this->getRestApiKey();

        if (!$appId || !$apiKey) {
            Log::info('OneSignal: Skipping notification (no keys configured)', ['title' => $title]);
            return false;
        }

        try {
            $payload = array_merge($target, [
                'app_id' => $appId,
                'headings' => ['en' => $title],
                'contents' => ['en' => $message],
                'data' => $data,
            ]);

            $response = Http::withHeaders([
                'Authorization' => "Basic {$apiKey}",
                'Content-Type' => 'application/json',
            ])->post('https://onesignal.com/api/v1/notifications', $payload);

            if ($response->successful()) {
                Log::info('OneSignal: Notification sent', ['title' => $title]);
                return true;
            }

            Log::error('OneSignal: Failed', ['response' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('OneSignal: Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
