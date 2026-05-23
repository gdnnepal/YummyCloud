<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private function getWebpushrToken(): ?string
    {
        return Setting::get('webpushr_token') ?: config('services.webpushr.token');
    }

    private function getWebpushrKey(): ?string
    {
        return Setting::get('webpushr_key') ?: config('services.webpushr.key');
    }

    /**
     * Send push notification to a specific user via Webpushr
     */
    public function sendToUser(int $userId, string $title, string $message, array $data = []): bool
    {
        $token = $this->getWebpushrToken();
        $key = $this->getWebpushrKey();

        if (!$token || !$key) {
            Log::info('Webpushr: Skipping notification (no keys configured)', ['title' => $title]);
            return false;
        }

        try {
            $payload = [
                'title' => $title,
                'message' => $message,
                'target_url' => config('app.frontend_url', 'https://nispakshya.com') . '/orders',
                'attribute' => ['user_id' => strval($userId)],
            ];

            $response = Http::withHeaders([
                'webpushrToken' => $token,
                'webpushrKey' => $key,
                'Content-Type' => 'application/json',
            ])->post('https://api.webpushr.com/v1/notification/send/attribute', $payload);

            if ($response->successful()) {
                Log::info('Webpushr: Notification sent', ['title' => $title, 'user_id' => $userId]);
                return true;
            }

            Log::error('Webpushr: Failed', ['response' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Webpushr: Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send push notification to all users via Webpushr
     */
    public function sendToAll(string $title, string $message, array $data = []): bool
    {
        $token = $this->getWebpushrToken();
        $key = $this->getWebpushrKey();

        if (!$token || !$key) {
            Log::info('Webpushr: Skipping notification (no keys configured)', ['title' => $title]);
            return false;
        }

        try {
            $payload = [
                'title' => $title,
                'message' => $message,
                'target_url' => config('app.frontend_url', 'https://nispakshya.com'),
                'segment' => 'everyone',
            ];

            $response = Http::withHeaders([
                'webpushrToken' => $token,
                'webpushrKey' => $key,
                'Content-Type' => 'application/json',
            ])->post('https://api.webpushr.com/v1/notification/send/all', $payload);

            if ($response->successful()) {
                Log::info('Webpushr: Broadcast sent', ['title' => $title]);
                return true;
            }

            Log::error('Webpushr: Broadcast failed', ['response' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Webpushr: Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
