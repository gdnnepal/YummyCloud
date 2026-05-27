<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OtpCode;
use App\Models\User;
use App\Models\Wallet;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|size:10',
            'password' => 'required|string|min:6',
        ]);

        // Check if phone exists
        $existingUser = User::where('phone', $request->phone)->first();
        if ($existingUser && $existingUser->is_verified) {
            return response()->json(['message' => 'Phone number already registered. Please login.'], 422);
        }

        // If unverified user exists, update their details
        if ($existingUser && !$existingUser->is_verified) {
            $existingUser->update([
                'name' => $request->name,
                'password' => $request->password,
            ]);
            $user = $existingUser;
        } else {
            $user = User::create([
                'name' => $request->name,
                'phone' => $request->phone,
                'password' => $request->password,
                'is_verified' => false,
            ]);
            Wallet::create(['user_id' => $user->id, 'balance' => 0]);
        }

        // Send OTP
        $otp = OtpCode::generate($request->phone, 'registration');
        app(SmsService::class)->sendOtp($request->phone, $otp->code);

        $response = [
            'message' => 'Registration successful. Please verify your phone number.',
            'requires_verification' => true,
        ];

        // In dev mode, include OTP for testing
        if (app()->environment('local')) {
            $response['otp'] = $otp->code;
        }

        return response()->json($response, 201);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|size:10',
            'otp' => 'required|string|size:6',
            'purpose' => 'in:registration,password_reset',
        ]);

        $purpose = $request->purpose ?? 'registration';

        if (!OtpCode::verify($request->phone, $request->otp, $purpose)) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP.'],
            ]);
        }

        if ($purpose === 'registration') {
            $user = User::where('phone', $request->phone)->first();
            if ($user) {
                $user->update(['is_verified' => true]);

                // Welcome bonus
                $welcomeBonus = (float) \App\Models\Setting::get('welcome_bonus', 100);
                if ($welcomeBonus > 0) {
                    $appName = \App\Models\Setting::get('kitchen_name') ?: 'our app';
                    $user->wallet?->credit($welcomeBonus, 'Welcome Bonus', "Welcome to {$appName}!");
                }

                $token = $user->createToken('auth-token')->plainTextToken;

                return response()->json([
                    'message' => 'Phone verified successfully.',
                    'user' => $user->only(['id', 'name', 'phone', 'role']),
                    'token' => $token,
                ]);
            }
        }

        return response()->json(['message' => 'OTP verified successfully.', 'verified' => true]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|size:10',
            'password' => 'required|string',
        ]);

        $user = User::where('phone', $request->phone)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'phone' => ['Invalid phone number or password.'],
            ]);
        }

        if (!$user->is_verified) {
            // Resend OTP
            $otp = OtpCode::generate($request->phone, 'registration');
            app(SmsService::class)->sendOtp($request->phone, $otp->code);

            $response = [
                'message' => 'Phone not verified. OTP sent.',
                'requires_verification' => true,
            ];

            if (app()->environment('local')) {
                $response['otp'] = $otp->code;
            }

            return response()->json($response, 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user' => $user->only(['id', 'name', 'phone', 'role']),
            'token' => $token,
        ]);
    }

    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|size:10',
            'purpose' => 'in:registration,password_reset',
        ]);

        $purpose = $request->purpose ?? 'password_reset';
        $otp = OtpCode::generate($request->phone, $purpose);
        app(SmsService::class)->sendOtp($request->phone, $otp->code);

        $response = ['message' => 'OTP sent successfully.'];

        if (app()->environment('local')) {
            $response['otp'] = $otp->code;
        }

        return response()->json($response);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|size:10',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6',
        ]);

        if (!OtpCode::verify($request->phone, $request->otp, 'password_reset')) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP.'],
            ]);
        }

        $user = User::where('phone', $request->phone)->first();
        if (!$user) {
            throw ValidationException::withMessages([
                'phone' => ['User not found.'],
            ]);
        }

        $user->update(['password' => $request->password]);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()->only(['id', 'name', 'phone', 'role']),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
        ]);

        $request->user()->update($request->only('name'));

        return response()->json([
            'message' => 'Profile updated.',
            'user' => $request->user()->only(['id', 'name', 'phone', 'role']),
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if (!Hash::check($request->current_password, $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $request->user()->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    public function savePushToken(Request $request)
    {
        $request->validate(['webpushr_sid' => 'required|string']);
        $request->user()->update(['webpushr_sid' => $request->webpushr_sid]);
        return response()->json(['message' => 'Push token saved.']);
    }
}
