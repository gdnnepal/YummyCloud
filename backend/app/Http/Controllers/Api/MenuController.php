<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function categories()
    {
        $categories = Category::where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'name_ne', 'icon', 'image']);

        return response()->json(['categories' => $categories]);
    }

    public function index(Request $request)
    {
        $query = MenuItem::where('is_available', true)
            ->where('is_reward', false)
            ->with('category:id,name,name_ne');

        if ($request->has('category') && $request->category) {
            $query->where('category_id', $request->category);
        }

        if ($request->has('featured') && $request->featured) {
            $query->where('is_featured', true);
        }

        $items = $query->orderBy('sort_order')->get();

        return response()->json(['items' => $items]);
    }

    public function search(Request $request)
    {
        $request->validate(['q' => 'required|string|min:2']);

        $items = MenuItem::where('is_available', true)
            ->where(function ($query) use ($request) {
                $query->where('name', 'like', "%{$request->q}%")
                    ->orWhere('name_ne', 'like', "%{$request->q}%");
            })
            ->with('category:id,name,name_ne')
            ->limit(20)
            ->get();

        return response()->json(['items' => $items]);
    }
}
