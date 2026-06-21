<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        $appName = \App\Models\Setting::get('kitchen_name', config('app.name'));
        return new Envelope(subject: "Order #{$this->order->order_number} Confirmed - {$appName}");
    }

    public function content(): Content
    {
        return new Content(view: 'emails.order-confirmation');
    }

    public function attachments(): array
    {
        return [];
    }
}
