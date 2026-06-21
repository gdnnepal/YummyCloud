<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed</title>
  <style>
    body { margin: 0; padding: 0; background: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: #e23744; padding: 32px 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 28px 24px; }
    .order-num { background: #f9f9f9; border: 1px solid #eee; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; text-align: center; }
    .order-num span { font-size: 13px; color: #888; display: block; }
    .order-num strong { font-size: 20px; color: #e23744; letter-spacing: 1px; }
    .section-title { font-size: 13px; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    table th { text-align: left; font-size: 12px; color: #888; padding: 6px 0; border-bottom: 1px solid #eee; }
    table td { padding: 10px 0; font-size: 14px; color: #333; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
    table td.qty { color: #888; font-size: 13px; }
    table td.price { text-align: right; font-weight: 600; white-space: nowrap; }
    .summary { background: #f9f9f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; }
    .summary-row { display: flex; justify-content: space-between; font-size: 14px; color: #555; margin-bottom: 8px; }
    .summary-row.total { font-weight: 700; font-size: 16px; color: #111; border-top: 1px solid #e5e5e5; padding-top: 10px; margin-top: 4px; }
    .address-box { background: #f9f9f9; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; font-size: 14px; color: #555; line-height: 1.6; }
    .badge { display: inline-block; background: #e23744; color: #fff; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
    .footer { background: #f5f5f5; padding: 18px 24px; text-align: center; }
    .footer p { margin: 0; font-size: 12px; color: #aaa; line-height: 1.6; }
    .footer a { color: #e23744; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎉 Order Confirmed!</h1>
      <p>Thank you for ordering from {{ \App\Models\Setting::get('kitchen_name', config('app.name')) }}</p>
    </div>
    <div class="body">
      <p style="font-size:15px;color:#333;margin:0 0 20px;">Hi <strong>{{ $order->user->name }}</strong>, your order has been placed successfully!</p>

      <div class="order-num">
        <span>Order Number</span>
        <strong>#{{ $order->order_number }}</strong>
      </div>

      <p class="section-title">Items Ordered</p>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>
          @foreach($order->items as $item)
          <tr>
            <td>{{ $item->name }}</td>
            <td class="qty" style="text-align:center">{{ $item->quantity }}</td>
            <td class="price">Rs. {{ number_format($item->total, 0) }}</td>
          </tr>
          @endforeach
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>Rs. {{ number_format($order->subtotal, 0) }}</span></div>
        @if($order->discount > 0)
        <div class="summary-row"><span>Discount</span><span style="color:#22c55e">- Rs. {{ number_format($order->discount, 0) }}</span></div>
        @endif
        @if($order->wallet_deduction > 0)
        <div class="summary-row"><span>Wallet Used</span><span style="color:#22c55e">- Rs. {{ number_format($order->wallet_deduction, 0) }}</span></div>
        @endif
        <div class="summary-row"><span>Delivery Fee</span><span>Rs. {{ number_format($order->delivery_fee, 0) }}</span></div>
        <div class="summary-row total"><span>Total</span><span>Rs. {{ number_format($order->total, 0) }}</span></div>
      </div>

      <p class="section-title">Delivery Address</p>
      <div class="address-box">{{ $order->address }}</div>

      <p class="section-title">Payment</p>
      <div style="margin-bottom:22px;font-size:14px;color:#555;">
        Method: <span class="badge">{{ strtoupper($order->payment_method) }}</span>
      </div>

      @if($order->note)
      <p class="section-title">Note</p>
      <div class="address-box">{{ $order->note }}</div>
      @endif

      <p style="font-size:13px;color:#888;text-align:center;margin:0;">Estimated delivery in <strong style="color:#333">~30 minutes</strong></p>
    </div>
    <div class="footer">
      <p>Questions? Contact us at <a href="https://{{ request()->getHost() }}">{{ \App\Models\Setting::get('kitchen_name', config('app.name')) }}</a></p>
      <p style="margin-top:6px;">© {{ date('Y') }} {{ \App\Models\Setting::get('kitchen_name', config('app.name')) }}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
