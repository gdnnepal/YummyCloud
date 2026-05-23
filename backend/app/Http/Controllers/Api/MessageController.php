<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $messages = $request->user()
            ->messages()
            ->orderByDesc('created_at')
            ->get();

        $unreadCount = $request->user()->messages()->where('is_read', false)->count();

        return response()->json([
            'messages' => $messages,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $message = $request->user()->messages()->findOrFail($id);
        $message->update(['is_read' => true]);

        return response()->json(['message' => 'Marked as read.']);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->messages()->where('is_read', false)->update(['is_read' => true]);

        return response()->json(['message' => 'All messages marked as read.']);
    }

    public function unreadCount(Request $request)
    {
        $count = $request->user()->messages()->where('is_read', false)->count();

        return response()->json(['unread_count' => $count]);
    }
}
