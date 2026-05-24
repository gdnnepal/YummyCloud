<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\MenuItem;
use App\Models\Message;
use App\Models\Order;
use App\Models\Refund;
use App\Models\User;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    // Dashboard
    public function dashboard(Request $request)
    {
        $period = $request->period ?? 'today';
        $query = Order::where('status', '!=', 'cancelled');

        if ($period === 'today') {
            $query->whereDate('created_at', today());
        } elseif ($period === 'week') {
            $query->where('created_at', '>=', now()->subWeek());
        } elseif ($period === 'month') {
            $query->where('created_at', '>=', now()->subMonth());
        }

        return response()->json([
            'total_orders' => Order::count(),
            'total_revenue' => $query->sum('total'),
            'total_customers' => User::where('role', 'customer')->count(),
            'pending_orders' => Order::whereIn('status', ['confirmed', 'preparing'])->count(),
            'period_orders' => $query->count(),
            'recent_orders' => Order::with('user:id,name,phone')->latest()->take(5)->get(),
        ]);
    }

    // Sales Report
    public function salesReport(Request $request)
    {
        $query = Order::with('user:id,name')->where('status', '!=', 'cancelled');
        if ($request->from) $query->whereDate('created_at', '>=', $request->from);
        if ($request->to) $query->whereDate('created_at', '<=', $request->to);
        if ($request->user_id) $query->where('user_id', $request->user_id);

        $orders = $query->latest()->get();

        return response()->json([
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total'),
            'total_discount' => $orders->sum('discount'),
            'total_wallet_deductions' => $orders->sum('wallet_deduction'),
            'avg_order_value' => $orders->count() > 0 ? round($orders->avg('total'), 2) : 0,
            'orders' => $orders,
        ]);
    }

    // Orders
    public function orders(Request $request)
    {
        $query = Order::with(['user:id,name,phone', 'items'])->latest();
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->from) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->to) {
            $query->whereDate('created_at', '<=', $request->to);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        return response()->json(['orders' => $query->get()]);
    }

    public function orderDetail($id)
    {
        $order = Order::with(['user:id,name,phone', 'items', 'logs', 'rating'])->findOrFail($id);
        return response()->json(['order' => $order]);
    }

    public function updateOrderStatus(Request $request, $id)
    {
        $order = Order::with('user')->findOrFail($id);
        $request->validate(['status' => 'required|in:confirmed,preparing,on_the_way,delivered,cancelled']);
        $order->update(['status' => $request->status]);
        if ($request->status === 'delivered') {
            $order->update(['delivered_at' => now()]);
        }
        // Log the status change
        \App\Models\OrderLog::create([
            'order_id' => $order->id,
            'status' => $request->status,
            'note' => $request->note ?? null,
            'created_at' => now(),
        ]);

        // Send push notification to customer
        $statusMessages = [
            'preparing' => 'Your order is being prepared! 🍳',
            'on_the_way' => 'Your order is on the way! 🚗',
            'delivered' => 'Your order has been delivered! ✅',
            'cancelled' => 'Your order has been cancelled.',
        ];
        if (isset($statusMessages[$request->status]) && $order->user) {
            app(\App\Services\NotificationService::class)->sendToUser(
                $order->user->id,
                "Order #{$order->order_number}",
                $statusMessages[$request->status],
                ['type' => 'order_status', 'order_id' => $order->id]
            );
        }

        return response()->json(['message' => 'Status updated.', 'order' => $order]);
    }

    public function assignDelivery(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $request->validate(['delivery_partner_id' => 'required|exists:users,id']);
        $order->update(['delivery_partner_id' => $request->delivery_partner_id]);
        return response()->json(['message' => 'Delivery partner assigned.']);
    }

    // Admin cancel order
    public function cancelOrder(Request $request, $id)
    {
        $order = Order::with('user')->findOrFail($id);
        $request->validate(['reason' => 'required|string|max:500']);

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Order is already cancelled.'], 422);
        }
        if ($order->status === 'delivered') {
            return response()->json(['message' => 'Cannot cancel a delivered order.'], 422);
        }

        $order->update(['status' => 'cancelled']);

        \App\Models\OrderLog::create([
            'order_id' => $order->id,
            'status' => 'cancelled',
            'note' => 'Cancelled by admin: ' . $request->reason,
            'created_at' => now(),
        ]);

        // Refund wallet deduction if any
        if ($order->wallet_deduction > 0 && $order->user) {
            $wallet = $order->user->wallet;
            if ($wallet) {
                $wallet->credit($order->wallet_deduction, 'Cancelled Order Refund', "Order #{$order->order_number}");
            }
        }

        // Notify customer
        app(\App\Services\NotificationService::class)->sendToUser(
            $order->user_id,
            "Order #{$order->order_number} Cancelled",
            "Your order has been cancelled. Reason: {$request->reason}",
            ['type' => 'order_status', 'order_id' => $order->id]
        );

        return response()->json(['message' => 'Order cancelled.', 'order' => $order->fresh()]);
    }

    // Admin create order on behalf of customer
    public function createOrder(Request $request)
    {
        $request->validate([
            'customer_name' => 'required|string',
            'customer_phone' => 'required|string|size:10',
            'address' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'payment_method' => 'required|in:cod,qr',
            'note' => 'nullable|string|max:500',
        ]);

        // Find or create customer
        $user = User::where('phone', $request->customer_phone)->first();
        if (!$user) {
            $user = User::create([
                'name' => $request->customer_name,
                'phone' => $request->customer_phone,
                'password' => bcrypt('password123'),
                'role' => 'customer',
                'is_verified' => true,
            ]);
            \App\Models\Wallet::create(['user_id' => $user->id, 'balance' => 0]);
        }

        // Calculate totals
        $subtotal = 0;
        $orderItems = [];
        foreach ($request->items as $item) {
            $menuItem = \App\Models\MenuItem::findOrFail($item['id']);
            $itemTotal = $menuItem->price * $item['quantity'];
            $subtotal += $itemTotal;
            $orderItems[] = [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name,
                'price' => $menuItem->price,
                'quantity' => $item['quantity'],
                'total' => $itemTotal,
            ];
        }

        $deliveryFee = (float) \App\Models\Setting::get('delivery_fee', 0);
        $total = $subtotal + $deliveryFee;

        $order = Order::create([
            'user_id' => $user->id,
            'order_number' => Order::generateOrderNumber(),
            'status' => 'confirmed',
            'subtotal' => $subtotal,
            'discount' => 0,
            'wallet_deduction' => 0,
            'delivery_fee' => $deliveryFee,
            'total' => $total,
            'payment_method' => $request->payment_method,
            'payment_status' => 'pending',
            'address' => $request->address,
            'note' => $request->note ?: 'Order placed by admin (phone call)',
            'estimated_delivery_at' => now()->addMinutes(30),
        ]);

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        \App\Models\OrderLog::create([
            'order_id' => $order->id,
            'status' => 'confirmed',
            'note' => 'Order created by admin on behalf of customer',
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Order created.', 'order' => $order->load('items')], 201);
    }

    // Categories
    public function categories() { return response()->json(['categories' => Category::orderBy('sort_order')->get()]); }
    public function createCategory(Request $request)
    {
        $request->validate(['name' => 'required|string']);
        $cat = Category::create($request->only('name', 'name_ne', 'icon'));
        return response()->json(['category' => $cat], 201);
    }
    public function updateCategory(Request $request, $id)
    {
        $cat = Category::findOrFail($id);
        $cat->update($request->only('name', 'name_ne', 'icon', 'is_active'));
        return response()->json(['category' => $cat]);
    }
    public function deleteCategory($id) { Category::findOrFail($id)->delete(); return response()->json(['message' => 'Deleted.']); }

    // Menu Items
    public function menuItems() { return response()->json(['items' => MenuItem::with('category:id,name')->orderBy('sort_order')->get()]); }
    public function createMenuItem(Request $request)
    {
        $request->validate(['name' => 'required', 'price' => 'required|numeric', 'category_id' => 'required|exists:categories,id']);
        $data = $request->only('name', 'name_ne', 'price', 'category_id', 'is_veg', 'is_available', 'is_featured');
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu-items', 'public');
        }
        $item = MenuItem::create($data);
        return response()->json(['item' => $item->load('category:id,name')], 201);
    }
    public function updateMenuItem(Request $request, $id)
    {
        $item = MenuItem::findOrFail($id);
        $data = $request->only('name', 'name_ne', 'price', 'category_id', 'is_veg', 'is_available', 'is_featured');
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('menu-items', 'public');
        }
        $item->update($data);
        return response()->json(['item' => $item->load('category:id,name')]);
    }
    public function deleteMenuItem($id) { MenuItem::findOrFail($id)->delete(); return response()->json(['message' => 'Deleted.']); }
    public function toggleMenuItem($id)
    {
        $item = MenuItem::findOrFail($id);
        $item->update(['is_available' => !$item->is_available]);
        return response()->json(['item' => $item->load('category:id,name')]);
    }

    // Users (customers only)
    public function users() {
        $users = User::where('role', 'customer')
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->orderByDesc('created_at')
            ->get(['id', 'name', 'phone', 'is_verified', 'created_at']);
        return response()->json(['users' => $users]);
    }

    // Coupons
    public function coupons() { return response()->json(['coupons' => Coupon::with('user:id,name,phone')->orderByDesc('created_at')->get()]); }
    public function createCoupon(Request $request)
    {
        $request->validate(['code' => 'required|unique:coupons,code', 'value' => 'required|numeric', 'type' => 'required|in:percent,fixed']);
        $coupon = Coupon::create($request->only('code', 'description', 'type', 'value', 'min_order', 'max_discount', 'usage_limit', 'is_active', 'user_id'));
        return response()->json(['coupon' => $coupon->load('user:id,name,phone')], 201);
    }
    public function deleteCoupon($id) { Coupon::findOrFail($id)->delete(); return response()->json(['message' => 'Deleted.']); }

    // Messages
    public function messages() { return response()->json(['messages' => Message::with('user:id,name')->latest()->take(50)->get()]); }
    public function sendMessage(Request $request)
    {
        $request->validate(['title' => 'required', 'body' => 'required', 'type' => 'required', 'user_id' => 'required']);
        $notification = app(\App\Services\NotificationService::class);

        if ($request->user_id === 'all') {
            $customers = User::where('role', 'customer')->pluck('id');
            foreach ($customers as $uid) {
                Message::create(['user_id' => $uid, 'title' => $request->title, 'body' => $request->body, 'type' => $request->type]);
            }
            // Send push to all
            $notification->sendToAll($request->title, $request->body, ['type' => 'message']);
            return response()->json(['message' => "Sent to {$customers->count()} customers."]);
        }

        Message::create(['user_id' => $request->user_id, 'title' => $request->title, 'body' => $request->body, 'type' => $request->type]);
        // Send push to specific user
        $notification->sendToUser((int) $request->user_id, $request->title, $request->body, ['type' => 'message']);
        return response()->json(['message' => 'Message sent.']);
    }

    // Refunds
    public function refunds() { return response()->json(['refunds' => Refund::with(['order:id,order_number', 'user:id,name,phone'])->latest()->get()]); }
    public function processRefund(Request $request, $id)
    {
        $refund = Refund::findOrFail($id);
        $request->validate(['status' => 'required|in:completed,rejected']);
        $refund->update(['status' => $request->status, 'admin_note' => $request->admin_note, 'processed_at' => now()]);
        return response()->json(['message' => 'Refund processed.', 'refund' => $refund]);
    }

    // Wallet Management
    public function getUserWallet(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        $wallet = $user->wallet;
        if (!$wallet) {
            $wallet = \App\Models\Wallet::create(['user_id' => $userId, 'balance' => 0]);
        }
        $transactions = $wallet->transactions()->latest()->take(20)->get();
        return response()->json([
            'user' => $user->only(['id', 'name', 'phone']),
            'balance' => $wallet->balance,
            'transactions' => $transactions,
        ]);
    }

    public function adjustWallet(Request $request, $userId)
    {
        $request->validate([
            'type' => 'required|in:credit,debit',
            'amount' => 'required|numeric|min:1',
            'note' => 'required|string|max:255',
        ]);
        $user = User::findOrFail($userId);
        $wallet = $user->wallet;
        if (!$wallet) {
            $wallet = \App\Models\Wallet::create(['user_id' => $userId, 'balance' => 0]);
        }
        if ($request->type === 'credit') {
            $wallet->credit($request->amount, 'Admin Credit', $request->note);
        } else {
            if ($wallet->balance < $request->amount) {
                return response()->json(['message' => 'Insufficient wallet balance.'], 422);
            }
            $wallet->debit($request->amount, 'Admin Debit', $request->note);
        }
        return response()->json(['message' => 'Wallet updated.', 'balance' => $wallet->fresh()->balance]);
    }
    public function deliveryPartners() { return response()->json(['partners' => User::where('role', 'delivery_partner')->get(['id', 'name', 'phone', 'is_verified', 'created_at'])]); }

    public function createDeliveryPartner(Request $request)
    {
        $request->validate(['name' => 'required|string', 'phone' => 'required|string|size:10|unique:users,phone', 'password' => 'required|string|min:6']);
        $partner = User::create(['name' => $request->name, 'phone' => $request->phone, 'password' => $request->password, 'role' => 'delivery_partner', 'is_verified' => true]);
        return response()->json(['partner' => $partner], 201);
    }

    public function updateDeliveryPartner(Request $request, $id)
    {
        $partner = User::where('role', 'delivery_partner')->findOrFail($id);
        $partner->update($request->only('name', 'phone'));
        if ($request->password) $partner->update(['password' => bcrypt($request->password)]);
        return response()->json(['partner' => $partner]);
    }

    public function deleteDeliveryPartner($id)
    {
        User::where('role', 'delivery_partner')->findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    public function suspendDeliveryPartner($id)
    {
        $partner = User::where('role', 'delivery_partner')->findOrFail($id);
        $partner->update(['is_verified' => !$partner->is_verified]);
        return response()->json(['message' => $partner->is_verified ? 'Activated' : 'Suspended', 'partner' => $partner]);
    }

    public function deliveryPartnerStats($id)
    {
        $partner = User::where('role', 'delivery_partner')->findOrFail($id);
        return response()->json([
            'partner' => $partner->only(['id', 'name', 'phone', 'is_verified', 'created_at']),
            'stats' => [
                'total_delivered' => Order::where('delivery_partner_id', $id)->where('status', 'delivered')->count(),
                'today_delivered' => Order::where('delivery_partner_id', $id)->where('status', 'delivered')->whereDate('delivered_at', today())->count(),
                'week_delivered' => Order::where('delivery_partner_id', $id)->where('status', 'delivered')->where('delivered_at', '>=', now()->subWeek())->count(),
                'active_orders' => Order::where('delivery_partner_id', $id)->whereIn('status', ['on_the_way'])->count(),
            ],
        ]);
    }

    // Settings
    public function getSettings()
    {
        return response()->json(['settings' => \App\Models\Setting::getAll()]);
    }

    public function updateSettings(Request $request)
    {
        foreach ($request->all() as $key => $value) {
            \App\Models\Setting::set($key, $value);
        }
        return response()->json(['message' => 'Settings updated.', 'settings' => \App\Models\Setting::getAll()]);
    }

    public function uploadQrImage(Request $request)
    {
        $request->validate(['qr_image' => 'required|image|max:5120']);
        $path = $request->file('qr_image')->store('settings', 'public');
        \App\Models\Setting::set('qr_image', $path);
        return response()->json(['message' => 'QR image uploaded.', 'path' => $path]);
    }

    public function reviews()
    {
        $reviews = \App\Models\Rating::with(['user:id,name,phone', 'order:id,order_number'])
            ->orderByDesc('created_at')
            ->get();
        return response()->json(['reviews' => $reviews]);
    }
}
