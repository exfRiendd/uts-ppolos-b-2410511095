<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'product_id', 'type', 'quantity',
        'stock_before', 'stock_after', 'note', 'created_by'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}