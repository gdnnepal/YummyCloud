<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function index(Request $request)
    {
        $wallet = $request->user()->wallet;

        if (!$wallet) {
            $wallet = $request->user()->wallet()->create(['balance' => 0]);
        }

        return response()->json([
            'balance' => $wallet->balance,
        ]);
    }

    public function transactions(Request $request)
    {
        $wallet = $request->user()->wallet;

        if (!$wallet) {
            return response()->json(['transactions' => []]);
        }

        $transactions = $wallet->transactions()
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['transactions' => $transactions]);
    }
}
