<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function adjust(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type'     => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'note'     => 'nullable|string|max:255',
        ]);

        $result = DB::transaction(function () use ($validated, $request, $product) {
            $stockBefore = $product->stock_quantity;

            $delta      = $validated['type'] === 'out' ? -$validated['quantity'] : $validated['quantity'];
            $stockAfter = $stockBefore + $delta;

            if ($stockAfter < 0) {
                throw new \Exception('Stok tidak mencukupi. Stok saat ini: ' . $stockBefore);
            }

            $product->update(['stock_quantity' => $stockAfter]);

            $movement = StockMovement::create([
                'product_id'   => $product->id,
                'type'         => $validated['type'],
                'quantity'     => $validated['quantity'],
                'stock_before' => $stockBefore,
                'stock_after'  => $stockAfter,
                'note'         => $validated['note'],
                'created_by'   => $request->auth_user_id,
            ]);

            return $movement;
        });

        return response()->json([
            'success' => true,
            'message' => 'Stok berhasil diperbarui.',
            'data'    => $result,
        ]);
    }

    public function reserveForOrder(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|integer',
            'items'    => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|integer|min:1',
        ]);

        $result = DB::transaction(function () use ($validated, $request) {
            $processed = [];

            foreach ($validated['items'] as $item) {
                $product = Product::lockForUpdate()->find($item['product_id']);

                if ($product->stock_quantity < $item['quantity']) {
                    throw new \Exception(
                        "Stok {$product->name} tidak mencukupi. " .
                        "Tersedia: {$product->stock_quantity}, diminta: {$item['quantity']}"
                    );
                }

                $stockBefore = $product->stock_quantity;
                $stockAfter  = $stockBefore - $item['quantity'];

                $product->update(['stock_quantity' => $stockAfter]);

                StockMovement::create([
                    'product_id'   => $product->id,
                    'type'         => 'out',
                    'quantity'     => $item['quantity'],
                    'stock_before' => $stockBefore,
                    'stock_after'  => $stockAfter,
                    'note'         => "Reserved untuk order #{$validated['order_id']}",
                    'created_by'   => $request->auth_user_id ?? 0,
                ]);

                \App\Models\OrderItem::create([
                    'product_id' => $product->id,
                    'order_id'   => $validated['order_id'],
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price,
                ]);

                $processed[] = [
                    'product_id' => $product->id,
                    'name'       => $product->name,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->price,
                ];
            }

            return $processed;
        });

        return response()->json([
            'success' => true,
            'message' => 'Stok berhasil direservasi untuk order.',
            'data'    => $result,
        ]);
    }

    public function history(Product $product)
    {
        $movements = $product->stockMovements()
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => $movements,
        ]);
    }
}