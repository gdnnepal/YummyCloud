<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function validate(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'total' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon) {
            return response()->json(['message' => 'Invalid coupon code.'], 422);
        }

        // Check if coupon is for a specific user
        if ($coupon->user_id && $coupon->user_id !== $request->user()->id) {
            return response()->json(['message' => 'This coupon is not valid for your account.'], 422);
        }

        if (!$coupon->isValid($request->total)) {
            $message = 'Coupon is not valid.';
            if ($request->total < $coupon->min_order) {
                $message = "Minimum order of Rs. {$coupon->min_order} required.";
            }
            return response()->json(['message' => $message], 422);
        }

        $discount = $coupon->calculateDiscount($request->total);

        return response()->json([
            'message' => 'Coupon applied successfully.',
            'coupon' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
                'discount' => $discount,
                'description' => $coupon->description,
            ],
        ]);
    }
}
