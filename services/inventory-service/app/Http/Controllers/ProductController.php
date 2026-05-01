<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->has('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('sku', 'like', "%{$request->search}%");
            });
        }
        if ($request->has('low_stock')) {
            $query->where('stock_quantity', '<=', 10);
        }

        $products = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id'    => 'required|exists:categories,id',
            'name'           => 'required|string|max:200',
            'sku'            => 'required|string|unique:products',
            'description'    => 'nullable|string',
            'price'          => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
        ]);

        $product = DB::transaction(function () use ($validated, $request) {
            $product = Product::create($validated);

            if ($validated['stock_quantity'] > 0) {
                StockMovement::create([
                    'product_id'   => $product->id,
                    'type'         => 'in',
                    'quantity'     => $validated['stock_quantity'],
                    'stock_before' => 0,
                    'stock_after'  => $validated['stock_quantity'],
                    'note'         => 'Stok awal saat produk dibuat',
                    'created_by'   => $request->auth_user_id,
                ]);
            }

            return $product;
        });

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data'    => $product->load('category'),
        ], 201);
    }

    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data'    => $product->load(['category', 'stockMovements' => function($q) {
                $q->latest()->limit(10);
            }]),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|exists:categories,id',
            'name'        => 'sometimes|string|max:200',
            'sku'         => 'sometimes|string|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'price'       => 'sometimes|numeric|min:0',
            'is_active'   => 'sometimes|boolean',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data'    => $product->fresh()->load('category'),
        ]);
    }

    public function destroy(Product $product)
    {
        $product->update(['is_active' => false]); // soft delete — jangan hapus fisik

        return response()->json([
            'success' => true,
            'message' => 'Produk dinonaktifkan.',
        ]);
    }
}