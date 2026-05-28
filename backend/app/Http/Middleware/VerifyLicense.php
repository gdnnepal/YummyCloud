<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyLicense
{
    public function __construct(private LicenseService $licenseService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        // Always allow license and settings endpoints (needed to activate license)
        if ($request->is('api/admin/license/*') || $request->is('api/admin/settings') || $request->is('api/admin/settings/*')) {
            return $next($request);
        }

        if (!$this->licenseService->isValid()) {
            return response()->json([
                'message' => 'Invalid or expired license. Please activate your license in Settings.',
                'license_error' => true,
            ], 403);
        }

        return $next($request);
    }
}
