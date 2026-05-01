<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockController;

Route::middleware('trust.gateway')->group(function () {

    Route::apiResource('categories', CategoryController::class);

    Route::apiResource('products', ProductController::class);

    Route::post('products/{product}/stock/adjust',  [StockController::class, 'adjust']);
    Route::get('products/{product}/stock/history',  [StockController::class, 'history']);

    Route::post('stock/reserve', [StockController::class, 'reserveForOrder']);
});

Route::get('health', fn() => response()->json([
    'status'  => 'ok',
    'service' => 'inventory-service',
]));