<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    private function getKey(): ?string
    {
        return Setting::get('webpushr_key') ?: config('services.webpushr.key');
    }

    private function getToken(): ?string
    {
        return Setting::get('webpushr_token') ?: config('services.webpushr.token');
    }

    /**
     * Send push notification to a specific user via Webpushr SID
     */
    public function sendToUser(int $userId, string $title, string $message, array $data = []): bool
    {
        $key = $this->getKey();
        $token = $this->getToken();

        if (!$key || !$token) {
            Log::info('Webpushr: Skipping notification (no keys configured)', ['title' => $title]);
            return false;
        }

        // Get user's webpushr_sid
        $user = User::find($userId);
        if (!$user || !$user->webpushr_sid) {
            Log::info('Webpushr: User has no SID', ['user_id' => $userId]);
            return false;
        }

        try {
            $payload = [
                'title' => $title,
                'message' => $message,
                'target_url' => config('app.frontend_url', 'https://nispakshya.com') . '/orders',
                'sid' => $user->webpushr_sid,
            ];

            $response = Http::withHeaders([
                'webpushrKey' => $key,
                'webpushrAuthToken' => $token,
                'Content-Type' => 'application/json',
            ])->post('https://api.webpushr.com/v1/notification/send/sid', $payload);

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
     * Send push notification to all subscribers via Webpushr
     */
    public function sendToAll(string $title, string $message, array $data = []): bool
    {
        $key = $this->getKey();
        $token = $this->getToken();

        if (!$key || !$token) {
            Log::info('Webpushr: Skipping broadcast (no keys configured)', ['title' => $title]);
            return false;
        }

        try {
            $payload = [
                'title' => $title,
                'message' => $message,
                'target_url' => config('app.frontend_url', 'https://nispakshya.com'),
            ];

            $response = Http::withHeaders([
                'webpushrKey' => $key,
                'webpushrAuthToken' => $token,
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
