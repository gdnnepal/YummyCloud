<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class LicenseService
{
    private string $verifyUrl = 'https://license.gdn.com.np/api/verify';
    private string $productSlug = 'yummycloud';

    /**
     * Verify the license key against the license server.
     * Caches the result for 24 hours to avoid excessive API calls.
     */
    public function verify(?string $licenseKey = null, bool $forceCheck = false): array
    {
        $licenseKey = $licenseKey ?: Setting::get('license_key');

        if (!$licenseKey) {
            return [
                'valid' => false,
                'message' => 'No license key configured.',
            ];
        }

        $cacheKey = 'license_status_' . md5($licenseKey);

        if (!$forceCheck && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $domain = $this->getCurrentDomain();

            $response = Http::timeout(10)->post($this->verifyUrl, [
                'license_key' => $licenseKey,
                'product_slug' => $this->productSlug,
                'domain' => $domain,
                'timestamp' => time(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $isValid = ($data['status'] ?? '') === 'valid';
                $result = [
                    'valid' => $isValid,
                    'message' => $data['message'] ?? 'License verified.',
                    'expires_at' => $data['expires_at'] ?? null,
                    'plan' => $data['plan'] ?? null,
                    'status' => $data['status'] ?? 'unknown',
                ];
            } else {
                $result = [
                    'valid' => false,
                    'message' => 'License server returned an error.',
                ];
            }
        } catch (\Exception $e) {
            Log::warning('License verification failed: ' . $e->getMessage());

            // On network failure, allow grace period using cached status
            $cached = Cache::get($cacheKey);
            if ($cached && $cached['valid']) {
                return $cached;
            }

            $result = [
                'valid' => false,
                'message' => 'Unable to reach license server. Please check your connection.',
            ];
        }

        // Cache for 24 hours
        Cache::put($cacheKey, $result, now()->addHours(24));

        // Store status in settings for quick access
        Setting::set('license_valid', $result['valid'] ? 'true' : 'false');
        Setting::set('license_message', $result['message']);

        return $result;
    }

    /**
     * Check if the current license is valid (uses cache first).
     */
    public function isValid(): bool
    {
        $result = $this->verify();
        return $result['valid'] === true;
    }

    /**
     * Get the current domain for license verification.
     */
    private function getCurrentDomain(): string
    {
        $appUrl = config('app.url', request()->getSchemeAndHttpHost());
        return parse_url($appUrl, PHP_URL_HOST) ?: request()->getHost();
    }

    /**
     * Clear cached license status (used when key changes).
     */
    public function clearCache(): void
    {
        $licenseKey = Setting::get('license_key');
        if ($licenseKey) {
            Cache::forget('license_status_' . md5($licenseKey));
        }
        Setting::set('license_valid', null);
        Setting::set('license_message', null);
    }
}
