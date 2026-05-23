<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->get();
        return response()->json(['addresses' => $addresses]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:50',
            'address' => 'required|string|max:255',
            'detail' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
        ]);

        // If first address, make it default
        $isFirst = $request->user()->addresses()->count() === 0;

        $address = $request->user()->addresses()->create([
            'label' => $request->label,
            'address' => $request->address,
            'detail' => $request->detail,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'is_default' => $isFirst,
        ]);

        return response()->json(['message' => 'Address added.', 'address' => $address], 201);
    }

    public function update(Request $request, Address $address)
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'label' => 'sometimes|string|max:50',
            'address' => 'sometimes|string|max:255',
            'detail' => 'nullable|string|max:255',
            'is_default' => 'sometimes|boolean',
        ]);

        if ($request->is_default) {
            // Remove default from others
            $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
        }

        $address->update($request->only(['label', 'address', 'detail', 'is_default']));

        return response()->json(['message' => 'Address updated.', 'address' => $address]);
    }

    public function destroy(Request $request, Address $address)
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // If deleted was default, make first remaining one default
        if ($wasDefault) {
            $first = $request->user()->addresses()->first();
            if ($first) $first->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address deleted.']);
    }
}
