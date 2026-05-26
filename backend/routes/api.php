<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\WalletController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Auth
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/auth/send-otp', [AuthController::class, 'sendOtp']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Menu (public)
Route::get('/categories', [MenuController::class, 'categories']);
Route::get('/menu', [MenuController::class, 'index']);
Route::get('/menu/search', [MenuController::class, 'search']);
Route::get('/settings/public', function () {
    $keys = ['kitchen_name', 'delivery_fee', 'delivery_fee_mandatory', 'estimated_delivery_time', 'qr_payment_info', 'qr_image', 'kitchen_phone', 'kitchen_address', 'min_order_amount', 'banner_enabled', 'banner_title', 'banner_subtitle', 'support_phone', 'reward_enabled', 'reward_orders_required', 'geofence_enabled', 'store_lat', 'store_lng', 'geofence_north', 'geofence_south', 'geofence_east', 'geofence_west', 'delivery_charge_presets', 'store_open_time', 'store_close_time'];
    $settings = \App\Models\Setting::whereIn('key', $keys)->pluck('value', 'key');
    return response()->json(['settings' => $settings]);
});

/*
|--------------------------------------------------------------------------
| Protected Routes (require auth token)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);
    Route::post('/profile/push-token', [AuthController::class, 'savePushToken']);

    // Addresses
    Route::get('/addresses', [AddressController::class, 'index']);
    Route::post('/addresses', [AddressController::class, 'store']);
    Route::put('/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/rate', [OrderController::class, 'rate']);

    // Rewards
    Route::get('/rewards', function (\Illuminate\Http\Request $request) {
        $rewardEnabled = \App\Models\Setting::get('reward_enabled', 'false') === 'true';
        if (!$rewardEnabled) {
            return response()->json(['eligible' => false, 'reward_items' => [], 'orders_until_reward' => 0]);
        }

        $requiredOrders = (int) \App\Models\Setting::get('reward_orders_required', 5);
        $user = $request->user();
        $deliveredCount = $user->orders()->where('status', 'delivered')->count();

        // Count rewards claimed (orders containing a reward item with price 0)
        $rewardsClaimed = \App\Models\OrderItem::whereHas('order', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('status', '!=', 'cancelled');
        })->where('price', 0)->whereHas('menuItem', function ($q) {
            $q->where('is_reward', true);
        })->count();

        // Eligible when delivered count reaches the next milestone
        // Milestones: 5, 10, 15, 20... = (rewardsClaimed + 1) * requiredOrders
        $nextMilestone = ($rewardsClaimed + 1) * $requiredOrders;
        $eligible = $deliveredCount >= $nextMilestone;
        $ordersUntilReward = $eligible ? 0 : $nextMilestone - $deliveredCount;

        $rewardItems = [];
        if ($eligible) {
            $rewardItems = \App\Models\MenuItem::where('is_reward', true)
                ->where('is_available', true)
                ->with('category:id,name,name_ne')
                ->get();
        }

        return response()->json([
            'eligible' => $eligible,
            'reward_items' => $rewardItems,
            'orders_until_reward' => max(0, $ordersUntilReward),
            'delivered_count' => $deliveredCount,
            'rewards_claimed' => $rewardsClaimed,
            'required_orders' => $requiredOrders,
        ]);
    });

    // Wallet
    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/transactions', [WalletController::class, 'transactions']);

    // Coupons
    Route::post('/coupons/validate', [CouponController::class, 'validate']);

    // Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
    Route::post('/messages/{id}/read', [MessageController::class, 'markRead']);
    Route::post('/messages/read-all', [MessageController::class, 'markAllRead']);
});

/*
|--------------------------------------------------------------------------
| Admin Routes (require auth + admin role)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/sales-report', [AdminController::class, 'salesReport']);

    Route::get('/orders', [AdminController::class, 'orders']);
    Route::get('/orders/{id}', [AdminController::class, 'orderDetail']);
    Route::put('/orders/{id}/status', [AdminController::class, 'updateOrderStatus']);
    Route::put('/orders/{id}/assign', [AdminController::class, 'assignDelivery']);
    Route::post('/orders/{id}/cancel', [AdminController::class, 'cancelOrder']);
    Route::post('/orders/create', [AdminController::class, 'createOrder']);

    Route::get('/categories', [AdminController::class, 'categories']);
    Route::post('/categories', [AdminController::class, 'createCategory']);
    Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
    Route::delete('/categories/{id}', [AdminController::class, 'deleteCategory']);

    Route::get('/menu-items', [AdminController::class, 'menuItems']);
    Route::post('/menu-items', [AdminController::class, 'createMenuItem']);
    Route::put('/menu-items/{id}', [AdminController::class, 'updateMenuItem']);
    Route::post('/menu-items/{id}', [AdminController::class, 'updateMenuItem']);
    Route::delete('/menu-items/{id}', [AdminController::class, 'deleteMenuItem']);
    Route::put('/menu-items/{id}/toggle', [AdminController::class, 'toggleMenuItem']);

    Route::get('/users', [AdminController::class, 'users']);
    Route::get('/users/{id}/wallet', [AdminController::class, 'getUserWallet']);
    Route::post('/users/{id}/wallet', [AdminController::class, 'adjustWallet']);

    Route::get('/coupons', [AdminController::class, 'coupons']);
    Route::post('/coupons', [AdminController::class, 'createCoupon']);
    Route::delete('/coupons/{id}', [AdminController::class, 'deleteCoupon']);

    Route::get('/messages', [AdminController::class, 'messages']);
    Route::post('/messages', [AdminController::class, 'sendMessage']);

    Route::get('/refunds', [AdminController::class, 'refunds']);
    Route::put('/refunds/{id}', [AdminController::class, 'processRefund']);

    Route::get('/delivery-partners', [AdminController::class, 'deliveryPartners']);
    Route::post('/delivery-partners', [AdminController::class, 'createDeliveryPartner']);
    Route::put('/delivery-partners/{id}', [AdminController::class, 'updateDeliveryPartner']);
    Route::delete('/delivery-partners/{id}', [AdminController::class, 'deleteDeliveryPartner']);
    Route::put('/delivery-partners/{id}/suspend', [AdminController::class, 'suspendDeliveryPartner']);
    Route::get('/delivery-partners/{id}/stats', [AdminController::class, 'deliveryPartnerStats']);

    Route::get('/settings', [AdminController::class, 'getSettings']);
    Route::put('/settings', [AdminController::class, 'updateSettings']);
    Route::post('/settings/qr-image', [AdminController::class, 'uploadQrImage']);
    Route::get('/reviews', [AdminController::class, 'reviews']);
});

/*
|--------------------------------------------------------------------------
| Rider Routes (require auth + delivery_partner role)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('rider')->group(function () {
    Route::get('/orders', function (\Illuminate\Http\Request $request) {
        $orders = \App\Models\Order::with(['user:id,name,phone', 'items'])
            ->where('delivery_partner_id', $request->user()->id)
            ->latest()
            ->get();
        return response()->json(['orders' => $orders]);
    });

    Route::get('/orders/{id}', function (\Illuminate\Http\Request $request, $id) {
        $order = \App\Models\Order::with(['user:id,name,phone', 'items'])
            ->where('delivery_partner_id', $request->user()->id)
            ->findOrFail($id);
        return response()->json(['order' => $order]);
    });

    Route::put('/orders/{id}/status', function (\Illuminate\Http\Request $request, $id) {
        $order = \App\Models\Order::where('delivery_partner_id', $request->user()->id)->findOrFail($id);
        $request->validate(['status' => 'required|in:on_the_way,delivered']);
        $order->update(['status' => $request->status]);
        if ($request->status === 'delivered') {
            $order->update(['delivered_at' => now()]);
            // Apply cashback
            $cashbackEnabled = \App\Models\Setting::get('cashback_enabled', 'false') === 'true';
            if ($cashbackEnabled) {
                $type = \App\Models\Setting::get('cashback_type', 'percent');
                $value = (float) \App\Models\Setting::get('cashback_value', 0);
                $maxCashback = (float) \App\Models\Setting::get('cashback_max', 0);
                if ($value > 0) {
                    $cashback = $type === 'percent' ? ((float) $order->subtotal * $value / 100) : $value;
                    if ($maxCashback > 0 && $cashback > $maxCashback) $cashback = $maxCashback;
                    $cashback = round($cashback, 2);
                    if ($cashback > 0) {
                        $wallet = $order->user->wallet ?? \App\Models\Wallet::create(['user_id' => $order->user_id, 'balance' => 0]);
                        $wallet->credit($cashback, 'Order Cashback', "Cashback for Order #{$order->order_number}", $order->id);
                    }
                }
            }
        }
        \App\Models\OrderLog::create(['order_id' => $order->id, 'status' => $request->status, 'note' => 'Updated by rider - ' . $request->user()->name, 'created_at' => now()]);
        // Notify customer
        app(\App\Services\NotificationService::class)->sendToUser(
            $order->user_id,
            "Order #{$order->order_number}",
            $request->status === 'delivered' ? 'Your order has been delivered! ✅' : 'Your order is on the way! 🚗',
            ['type' => 'order_status', 'order_id' => $order->id]
        );
        return response()->json(['message' => 'Status updated.', 'order' => $order]);
    });

    Route::get('/stats', function (\Illuminate\Http\Request $request) {
        $id = $request->user()->id;
        $todayCodTotal = \App\Models\Order::where('delivery_partner_id', $id)
            ->where('status', 'delivered')
            ->where('payment_method', 'cod')
            ->whereDate('delivered_at', today())
            ->sum('total');
        return response()->json(['stats' => [
            'today' => \App\Models\Order::where('delivery_partner_id', $id)->where('status', 'delivered')->whereDate('delivered_at', today())->count(),
            'active' => \App\Models\Order::where('delivery_partner_id', $id)->whereIn('status', ['preparing', 'on_the_way'])->count(),
            'total' => \App\Models\Order::where('delivery_partner_id', $id)->where('status', 'delivered')->count(),
            'cod_to_return' => $todayCodTotal,
        ]]);
    });

    Route::put('/orders/{id}/location', function (\Illuminate\Http\Request $request, $id) {
        $order = \App\Models\Order::where('delivery_partner_id', $request->user()->id)->findOrFail($id);
        $request->validate(['lat' => 'required|numeric', 'lng' => 'required|numeric']);
        $order->update([
            'rider_lat' => $request->lat,
            'rider_lng' => $request->lng,
            'rider_location_updated_at' => now(),
        ]);
        return response()->json(['message' => 'Location updated.']);
    });
});
