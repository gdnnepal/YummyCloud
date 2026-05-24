<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $orders = $request->user()
            ->orders()
            ->with('items')
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['orders' => $orders]);
    }

    public function show(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $order->load(['items', 'rating', 'logs', 'deliveryPartner:id,name,phone']);

        return response()->json(['order' => $order]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'address' => 'required|string',
            'customer_lat' => 'nullable|numeric',
            'customer_lng' => 'nullable|numeric',
            'payment_method' => 'required|in:cod,qr',
            'payment_screenshot' => 'nullable|image|max:5120',
            'coupon_code' => 'nullable|string',
            'note' => 'nullable|string|max:500',
            'use_wallet' => 'nullable|boolean',
        ]);

        // Calculate totals
        $subtotal = 0;
        $orderItems = [];
        $hasRewardItem = false;

        foreach ($request->items as $item) {
            $menuItem = MenuItem::findOrFail($item['id']);
            if (!$menuItem->is_available) {
                return response()->json([
                    'message' => "{$menuItem->name} is currently unavailable.",
                ], 422);
            }

            $itemPrice = $menuItem->price;

            // Handle reward item (free, qty 1)
            if ($menuItem->is_reward && !$hasRewardItem) {
                // Verify eligibility
                $rewardEnabled = \App\Models\Setting::get('reward_enabled', 'false') === 'true';
                $requiredOrders = (int) \App\Models\Setting::get('reward_orders_required', 5);
                $deliveredCount = $request->user()->orders()->where('status', 'delivered')->count();
                $rewardsClaimed = \App\Models\OrderItem::whereHas('order', function ($q) use ($request) {
                    $q->where('user_id', $request->user()->id)->where('status', 'delivered');
                })->where('price', 0)->count();
                $ordersInCycle = $deliveredCount - ($rewardsClaimed * $requiredOrders);

                if ($rewardEnabled && $ordersInCycle >= $requiredOrders) {
                    $itemPrice = 0;
                    $hasRewardItem = true;
                } else {
                    return response()->json(['message' => 'You are not eligible for this reward item.'], 422);
                }
            } elseif ($menuItem->is_reward && $hasRewardItem) {
                return response()->json(['message' => 'Only 1 free reward item per order.'], 422);
            } elseif ($menuItem->is_reward) {
                return response()->json(['message' => 'You are not eligible for this reward item.'], 422);
            }

            $itemTotal = $itemPrice * $item['quantity'];
            $subtotal += $itemTotal;
            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'price' => $itemPrice,
                'quantity' => $item['quantity'],
                'total' => $itemTotal,
            ];
        }

        // Apply coupon (only on item subtotal)
        $discount = 0;

        // Check minimum order amount
        $minOrder = (float) \App\Models\Setting::get('min_order_amount', 0);
        if ($minOrder > 0 && $subtotal < $minOrder) {
            return response()->json([
                'message' => "Minimum order amount is Rs. {$minOrder}. Your cart total is Rs. {$subtotal}.",
            ], 422);
        }

        if ($request->coupon_code) {
            $coupon = Coupon::where('code', $request->coupon_code)->first();
            if ($coupon && $coupon->isValid($subtotal)) {
                $discount = $coupon->calculateDiscount($subtotal);
                $coupon->increment('used_count');
            }
        }

        // Delivery fee is always applied
        $deliveryFee = (float) \App\Models\Setting::get('delivery_fee', 0);
        $feeMandatory = \App\Models\Setting::get('delivery_fee_mandatory', 'true') === 'true';

        // Wallet deduction
        $walletDeduction = 0;
        if (filter_var($request->use_wallet, FILTER_VALIDATE_BOOLEAN)) {
            $wallet = $request->user()->wallet;
            if (!$wallet) {
                $wallet = \App\Models\Wallet::create(['user_id' => $request->user()->id, 'balance' => 0]);
            }
            if ($wallet->balance > 0) {
                if ($feeMandatory) {
                    // Wallet can only cover items after discount, NOT delivery fee
                    $walletDeduction = min($wallet->balance, max(0, $subtotal - $discount));
                } else {
                    // Wallet can cover everything including delivery fee
                    $walletDeduction = min($wallet->balance, $subtotal - $discount + $deliveryFee);
                }
            }
        }

        // Calculate total
        if ($feeMandatory) {
            $total = max(0, $subtotal - $discount) - $walletDeduction + $deliveryFee;
        } else {
            $total = $subtotal - $discount + $deliveryFee - $walletDeduction;
        }

        // Handle payment screenshot
        $screenshotPath = null;
        if ($request->hasFile('payment_screenshot')) {
            $screenshotPath = $request->file('payment_screenshot')->store('payment-screenshots', 'public');
        }

        // Create order
        $order = Order::create([
            'user_id' => $request->user()->id,
            'order_number' => Order::generateOrderNumber(),
            'status' => 'confirmed',
            'subtotal' => $subtotal,
            'discount' => $discount,
            'wallet_deduction' => $walletDeduction,
            'delivery_fee' => $deliveryFee,
            'total' => $total,
            'payment_method' => $request->payment_method,
            'payment_status' => $request->payment_method === 'cod' ? 'pending' : 'pending',
            'payment_screenshot' => $screenshotPath,
            'coupon_code' => $request->coupon_code,
            'address' => $request->address,
            'customer_lat' => $request->customer_lat,
            'customer_lng' => $request->customer_lng,
            'note' => $request->note,
            'estimated_delivery_at' => now()->addMinutes(30),
        ]);

        // Create order items
        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        // Debit wallet if used
        if ($walletDeduction > 0) {
            $userWallet = $request->user()->wallet;
            if ($userWallet) {
                $userWallet->debit(
                    $walletDeduction,
                    'Order Payment',
                    "Order #{$order->order_number}",
                    $order->id
                );
            }
        }

        // Log order creation
        \App\Models\OrderLog::create([
            'order_id' => $order->id,
            'status' => 'confirmed',
            'note' => 'Order placed by customer',
            'created_at' => now(),
        ]);

        $order->load('items');

        return response()->json([
            'message' => 'Order placed successfully.',
            'order' => $order,
        ], 201);
    }

    public function cancel(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only allow cancellation within 3 minutes of placing order
        $minutesSinceOrder = now()->diffInMinutes($order->created_at);
        if ($minutesSinceOrder > 3) {
            return response()->json([
                'message' => 'Order can only be cancelled within 3 minutes of placing.',
            ], 422);
        }

        // Cannot cancel if already preparing or beyond
        if (in_array($order->status, ['preparing', 'on_the_way', 'delivered', 'cancelled'])) {
            return response()->json([
                'message' => 'Order cannot be cancelled at this stage.',
            ], 422);
        }

        $reason = $request->reason ?? 'No reason provided';
        $order->update(['status' => 'cancelled']);

        \App\Models\OrderLog::create([
            'order_id' => $order->id,
            'status' => 'cancelled',
            'note' => 'Cancelled by customer: ' . $reason,
            'created_at' => now(),
        ]);

        $wallet = $request->user()->wallet;
        $refundMessages = [];

        // 1. Restore wallet deduction instantly
        if ($order->wallet_deduction > 0 && $wallet) {
            $wallet->credit(
                $order->wallet_deduction,
                'Cancelled Order Refund',
                "Order #{$order->order_number}",
                $order->id
            );

            \App\Models\Refund::create([
                'order_id' => $order->id,
                'user_id' => $request->user()->id,
                'amount' => $order->wallet_deduction,
                'type' => 'wallet',
                'status' => 'completed',
                'reason' => 'Order cancelled by customer',
                'processed_at' => now(),
            ]);

            $refundMessages[] = "Rs. {$order->wallet_deduction} restored to wallet instantly.";
        }

        // 2. Handle payment refund based on method
        $payableAmount = $order->total; // amount customer actually paid (after wallet deduction)

        if ($payableAmount > 0) {
            if ($order->payment_method === 'cod') {
                // COD - no money was collected, no refund needed
                $refundMessages[] = "No payment was collected (COD).";
            } else if ($order->payment_method === 'qr') {
                // QR payment - create pending refund for admin to process
                \App\Models\Refund::create([
                    'order_id' => $order->id,
                    'user_id' => $request->user()->id,
                    'amount' => $payableAmount,
                    'type' => 'qr_payment',
                    'status' => 'pending',
                    'reason' => 'Order cancelled by customer',
                ]);

                $refundMessages[] = "Rs. {$payableAmount} QR payment refund is being processed. It will be returned within 2 business days.";
            }
        }

        $message = 'Order cancelled. ' . implode(' ', $refundMessages);

        return response()->json([
            'message' => $message,
            'order' => $order->fresh(),
        ]);
    }

    public function rate(Request $request, Order $order)
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'Can only rate delivered orders.'], 422);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:500',
        ]);

        $rating = $order->rating()->updateOrCreate(
            ['user_id' => $request->user()->id],
            ['rating' => $request->rating, 'review' => $request->review]
        );

        return response()->json(['message' => 'Rating submitted.', 'rating' => $rating]);
    }
}
