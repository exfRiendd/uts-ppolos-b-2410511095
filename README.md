# uts-ppolos-b-2410511095

Link VIDEO DEMO POSTMAN : https://youtu.be/v61jEKGqZXw

Sistem inventaris berbasis microservices dengan 3 service + 1 API GAteway.

nama : Syahdewa Maulana
nim : 2410511095

# Arsitektur

Client → API Gateway (:3000)
├── Auth Service (:3001) — Node.js + SQLite
├── Inventory Service (:8000) — PHP Laravel + MySQL
└── Order Service (:3002) — Node.js + MySQL

# Cara Menjalankan

Terminal 1 - Gateway
cd gateway && npm install && npm run dev

Terminal 2 - Auth
cd services/auth-service && npm install && npm run dev

Terminal 3 - Inventory
cd services/inventory-service
composer install
cp .env.example .env && php artisan
key:generate
php artisan migrate && php artisan serve --port=8000

Terminal 4 - Order Service
cd services/order-service && npm install && npm run dev

# PETA ENDPOINT

POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET /api/auth/github
GET /api/inventory/categories
POST /api/inventory/categories
GET /api/inventory/products
GET /api/inventory/products/:id
POST /api/inventory/products/:id/stock/adjust
GET /api/suppliers
POST api/orders/suppliers
GET /api/orders
POST /api/orders
