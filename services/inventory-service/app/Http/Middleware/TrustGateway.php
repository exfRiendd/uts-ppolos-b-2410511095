<?php
// app/Http/Middleware/TrustGateway.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TrustGateway
{
    public function handle(Request $request, Closure $next)
    {
        $userId = $request->header('x-user-id');
        $role   = $request->header('x-user-role', 'user');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'Request harus melalui API Gateway.',
            ], 401);
        }

        $request->merge([
            'auth_user_id'   => (int) $userId,
            'auth_user_role' => $role,
        ]);

        return $next($request);
    }
}