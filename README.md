# UTS — Sistem Manajemen Inventory & Order (Microservices)

Proyek ini merupakan sistem berbasis **microservices** yang terdiri dari empat layanan utama: API Gateway, Auth Service, Inventory Service, dan Order Service. Semua request dari client masuk melalui satu pintu yaitu API Gateway, yang bertugas memvalidasi JWT dan meneruskan request ke service yang sesuai.

---

## Daftar Isi

- [Arsitektur Sistem](#arsitektur-sistem)
- [Struktur Folder](#struktur-folder)
- [Tech Stack](#tech-stack)
- [Cara Menjalankan](#cara-menjalankan)
- [Variabel Environment](#variabel-environment)
- [Dokumentasi API & Pengujian Postman](#dokumentasi-api--pengujian-postman)
  - [Auth Service](#1-auth-service--baseurl-httplocalhostport3000apauth)
  - [Inventory Service](#2-inventory-service--baseurl-httplocalhostport3000apiinventory)
  - [Order Service](#3-order-service--baseurl-httplocalhostport3000apiorders)
- [Alur Request Antar Service](#alur-request-antar-service)
- [Catatan Perbaikan Bug](#catatan-perbaikan-bug)

---

## Arsitektur Sistem

```
Client (Browser / Postman)
        │
        ▼
┌───────────────────┐
│    API Gateway    │  :3000
│  - Rate Limiter   │
│  - JWT Validator  │
│  - Proxy Router   │
└─────────┬─────────┘
          │
    ┌─────┴──────────────────────┐
    │             │              │
    ▼             ▼              ▼
┌────────┐  ┌──────────┐  ┌──────────┐
│  Auth  │  │Inventory │  │  Order   │
│Service │  │ Service  │  │ Service  │
│ :3001  │  │  :8000   │  │  :3002   │
│SQLite  │  │  MySQL   │  │  MySQL   │
└────────┘  └──────────┘  └──────────┘
                  ▲              │
                  └──────────────┘
             inter-service call
          (reserveStock & getProduct)
```

Semua route **kecuali** `/api/auth/*` dan `/health` memerlukan JWT yang valid di header `Authorization: Bearer <token>`.

---

## Struktur Folder

```
.
├── docker-compose.yml
├── gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── app.js                        # Entry point, urutan middleware
│       ├── config/
│       │   └── services.js               # Daftar URL & prefix tiap service
│       ├── middlewares/
│       │   ├── jwtValidator.js           # Validasi Bearer token, inject x-user-* header
│       │   └── rateLimiter.js            # 60 req/menit per IP
│       └── routes/
│           └── proxy.js                  # Proxy ke upstream service
│
└── services/
    ├── auth-service/
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── app.js
    │       ├── config/database.js        # SQLite via better-sqlite3
    │       ├── controllers/
    │       │   ├── authController.js     # register, login, refresh, logout, verifyToken
    │       │   └── oauthController.js    # GitHub OAuth 2.0
    │       ├── middlewares/validate.js
    │       ├── models/
    │       │   ├── User.js
    │       │   ├── RefreshToken.js
    │       │   └── OauthAccount.js
    │       ├── routes/auth.js
    │       └── services/tokenService.js  # generate / verify / revoke JWT & refresh token
    │
    ├── inventory-service/                # Laravel 11
    │   ├── Dockerfile
    │   ├── app/
    │   │   ├── Http/
    │   │   │   ├── Controllers/
    │   │   │   │   ├── CategoryController.php
    │   │   │   │   ├── ProductController.php
    │   │   │   │   └── StockController.php
    │   │   │   └── Middleware/
    │   │   │       └── TrustGateway.php  # Cek header x-user-id dari gateway
    │   │   └── Models/
    │   │       ├── Category.php
    │   │       ├── Product.php
    │   │       └── StockMovement.php
    │   ├── database/migrations/
    │   └── routes/api.php
    │
    └── order-service/
        ├── Dockerfile
        ├── app.js                        # Entry point, sync Sequelize
        ├── package.json
        └── src/
            ├── config/database.js        # Sequelize + MySQL
            ├── controllers/
            │   ├── OrderController.js    # CRUD order + reservasi stok
            │   └── SupplierController.js # CRUD supplier
            ├── models/
            │   ├── Order.js
            │   └── Supplier.js
            ├── routes/index.js
            └── services/
                └── inventoryClient.js    # HTTP client ke inventory-service
```

---

## Tech Stack

| Komponen          | Teknologi                                                  |
| ----------------- | ---------------------------------------------------------- |
| API Gateway       | Node.js, Express 5, http-proxy-middleware                  |
| Auth Service      | Node.js, Express 4, better-sqlite3, bcryptjs, jsonwebtoken |
| Inventory Service | PHP 8.2, Laravel 11, MySQL 8                               |
| Order Service     | Node.js, Express 5, Sequelize 6, MySQL 8                   |
| Containerization  | Docker, Docker Compose                                     |

---

## Cara Menjalankan

### Menggunakan Docker Compose (direkomendasikan)

```bash
# 1. Clone repositori
git clone https://github.com/exfRiendd/uts-ppolos-b-2410511095.git
cd uts-ppolos-b-2410511095

# 2. Buat file .env di root untuk GitHub OAuth (opsional)
echo "GITHUB_CLIENT_ID=your_client_id" >> .env
echo "GITHUB_CLIENT_SECRET=your_client_secret" >> .env

# 3. Jalankan semua service
docker compose up --build -d

# 4. Cek status semua container
docker compose ps
```

Setelah semua container `healthy`, endpoint siap diakses di `http://localhost:3000`.

### Menjalankan Manual (tanpa Docker)

```bash
# Gateway
cd gateway && npm install && npm run dev

# Auth Service
cd services/auth-service && npm install && npm run dev

# Inventory Service
cd services/inventory-service
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate
php artisan serve --port=8000

# Order Service
cd services/order-service && npm install && npm run dev
```

> **Pastikan** MySQL berjalan di port 3307 (inventory) dan 3308 (order) atau sesuaikan file `.env` masing-masing service.

---

## Variabel Environment

### `gateway/.env`

```env
PORT=3000
JWT_SECRET=your_jwt_secret_min_32_chars

AUTH_SERVICE_URL=http://localhost:3001
INVENTORY_SERVICE_URL=http://localhost:8000
ORDER_SERVICE_URL=http://localhost:3002

ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### `services/auth-service/.env`

```env
PORT=3001
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_MS=604800000

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback
```

### `services/inventory-service/.env`

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=inventory_db
DB_USERNAME=inventory_user
DB_PASSWORD=inventory_pass
```

### `services/order-service/.env`

```env
PORT=3002
DB_HOST=127.0.0.1
DB_PORT=3308
DB_NAME=order_db
DB_USER=order_user
DB_PASS=order_pass
INVENTORY_SERVICE_URL=http://localhost:8000
```

---

## Dokumentasi API & Pengujian Postman

**Base URL semua request:** `http://localhost:3000`

> Header `Authorization: Bearer <access_token>` **wajib** disertakan untuk semua endpoint kecuali `/api/auth/register`, `/api/auth/login`, dan `/health`.

---

### 1. Auth Service — `BASE_URL: http://localhost:{PORT}/api/auth`

#### POST `/api/auth/register` — Registrasi user baru

**Request Body:**

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Response `409 Conflict`** (email/username sudah dipakai):

```json
{
  "success": false,
  "message": "Email atau username sudah digunakan."
}
```

---

#### POST `/api/auth/login` — Login user

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

> `refreshToken` dikirim lewat **HttpOnly cookie** secara otomatis.

---

#### POST `/api/auth/refresh` — Perbarui access token

Tidak butuh body. `refreshToken` dibaca dari cookie secara otomatis.

**Response `200 OK`:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### POST `/api/auth/logout` — Logout user

Tidak butuh body. Refresh token di-revoke dan cookie dihapus.

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Logout berhasil."
}
```

---

#### GET `/api/auth/verify` — Verifikasi access token

**Header:** `Authorization: Bearer <access_token>`

**Response `200 OK`:**

```json
{
  "valid": true,
  "user": {
    "sub": 1,
    "email": "john@example.com",
    "role": "user",
    "iat": 1700000000,
    "exp": 1700000900
  }
}
```

---

#### GET `/api/auth/github` — Redirect ke GitHub OAuth

Browser akan di-redirect ke halaman otorisasi GitHub. Tidak bisa diuji langsung dari Postman — gunakan browser.

---

### 2. Inventory Service — `BASE_URL: http://localhost:{PORT}/api/inventory`

> Semua endpoint di bawah memerlukan `Authorization: Bearer <token>`.

---

#### GET `/api/inventory/categories` — Daftar semua kategori

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Elektronik",
      "description": "Perangkat elektronik",
      "products_count": 5
    }
  ]
}
```

---

#### POST `/api/inventory/categories` — Tambah kategori baru

**Request Body:**

```json
{
  "name": "Elektronik",
  "description": "Perangkat elektronik dan aksesoris"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Kategori berhasil dibuat.",
  "data": {
    "id": 1,
    "name": "Elektronik",
    "description": "Perangkat elektronik dan aksesoris"
  }
}
```

---

#### GET `/api/inventory/products` — Daftar produk (dengan filter)

**Query Parameters (opsional):**

| Parameter     | Tipe   | Keterangan                     |
| ------------- | ------ | ------------------------------ |
| `category_id` | int    | Filter berdasarkan kategori    |
| `search`      | string | Cari berdasarkan nama atau SKU |
| `low_stock`   | -      | Tampilkan produk stok ≤ 10     |

**Contoh:** `GET /api/inventory/products?search=laptop&low_stock`

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "category_id": 1,
        "name": "Laptop ASUS",
        "sku": "LAPTOP-ASUS-001",
        "price": "8500000.00",
        "stock_quantity": 10,
        "is_active": true,
        "category": { "id": 1, "name": "Elektronik" }
      }
    ],
    "per_page": 15,
    "total": 1
  }
}
```

---

#### POST `/api/inventory/products` — Tambah produk baru

**Request Body:**

```json
{
  "category_id": 1,
  "name": "Laptop ASUS VivoBook",
  "sku": "LAPTOP-ASUS-001",
  "description": "Laptop untuk keperluan sehari-hari",
  "price": 8500000,
  "stock_quantity": 20
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Produk berhasil ditambahkan.",
  "data": {
    "id": 1,
    "name": "Laptop ASUS VivoBook",
    "sku": "LAPTOP-ASUS-001",
    "price": "8500000.00",
    "stock_quantity": 20,
    "category": { "id": 1, "name": "Elektronik" }
  }
}
```

---

#### GET `/api/inventory/products/{id}` — Detail produk

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Laptop ASUS VivoBook",
    "stock_quantity": 20,
    "category": { "id": 1, "name": "Elektronik" },
    "stock_movements": [
      {
        "id": 1,
        "type": "in",
        "quantity": 20,
        "stock_before": 0,
        "stock_after": 20,
        "note": "Stok awal saat produk dibuat"
      }
    ]
  }
}
```

---

#### PUT `/api/inventory/products/{id}` — Update produk

**Request Body** (semua field opsional):

```json
{
  "name": "Laptop ASUS VivoBook 15",
  "price": 9000000,
  "is_active": true
}
```

---

#### DELETE `/api/inventory/products/{id}` — Nonaktifkan produk

Produk tidak dihapus secara fisik — hanya `is_active` diset `false`.

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Produk dinonaktifkan."
}
```

---

#### POST `/api/inventory/products/{id}/stock/adjust` — Ubah stok manual

**Request Body:**

```json
{
  "type": "in",
  "quantity": 50,
  "note": "Restock dari supplier"
}
```

> `type` bisa: `in` (masuk), `out` (keluar), `adjustment` (koreksi).

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Stok berhasil diperbarui.",
  "data": {
    "product_id": 1,
    "type": "in",
    "quantity": 50,
    "stock_before": 20,
    "stock_after": 70
  }
}
```

---

#### GET `/api/inventory/products/{id}/stock/history` — Riwayat mutasi stok

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 2,
        "type": "in",
        "quantity": 50,
        "stock_before": 20,
        "stock_after": 70,
        "note": "Restock dari supplier",
        "created_at": "2026-05-01T10:00:00.000000Z"
      }
    ]
  }
}
```

---

### 3. Order Service — `BASE_URL: http://localhost:{PORT}/api/orders`

> Semua endpoint di bawah memerlukan `Authorization: Bearer <token>`.

---

#### GET `/api/orders/suppliers` — Daftar supplier

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "PT Maju Jaya",
      "contact_email": "supplier@majujaya.com",
      "phone": "08123456789",
      "address": "Jakarta"
    }
  ]
}
```

---

#### POST `/api/orders/suppliers` — Tambah supplier

**Request Body:**

```json
{
  "name": "PT Maju Jaya",
  "contact_email": "supplier@majujaya.com",
  "phone": "08123456789",
  "address": "Jl. Raya No. 1, Jakarta"
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "PT Maju Jaya",
    "contact_email": "supplier@majujaya.com"
  }
}
```

---

#### GET `/api/orders` — Daftar semua order

**Response `200 OK`:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "supplier_id": 1,
      "status": "confirmed",
      "total_amount": "17000000.00",
      "note": "Pesanan mendesak",
      "created_by": "3",
      "supplier": { "id": 1, "name": "PT Maju Jaya" }
    }
  ]
}
```

---

#### POST `/api/orders` — Buat order baru

Endpoint ini secara otomatis:

1. Mengambil detail produk dari Inventory Service
2. Menghitung total harga
3. Membuat record order dengan status `pending`
4. Memanggil `reserveStock` ke Inventory Service (stok dikurangi)
5. Update status order menjadi `confirmed`

**Request Body:**

```json
{
  "supplier_id": 1,
  "note": "Pesanan mendesak bulan ini",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 1 }
  ]
}
```

**Response `201 Created`:**

```json
{
  "success": true,
  "message": "Order berhasil dibuat.",
  "data": {
    "id": 1,
    "status": "confirmed",
    "total_amount": "17000000.00",
    "items": [
      {
        "product_id": 1,
        "product_name": "Laptop ASUS VivoBook",
        "quantity": 2,
        "unit_price": "8500000.00"
      }
    ]
  }
}
```

**Response `422 Unprocessable`** (stok tidak cukup):

```json
{
  "success": false,
  "message": "Order dibatalkan: Stok Laptop ASUS tidak mencukupi. Tersedia: 1, diminta: 2",
  "order_id": 5
}
```

---

#### GET `/api/orders/{id}` — Detail order

**Response `200 OK`:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "confirmed",
    "total_amount": "17000000.00",
    "supplier": { "id": 1, "name": "PT Maju Jaya" }
  }
}
```

---

#### PATCH `/api/orders/{id}/cancel` — Batalkan order

Hanya order dengan status `pending` yang bisa dibatalkan.

**Response `200 OK`:**

```json
{
  "success": true,
  "message": "Order dibatalkan."
}
```

**Response `422`** (order sudah confirmed):

```json
{
  "success": false,
  "message": "Hanya order pending yang bisa dibatalkan."
}
```

---

### Health Check

```
GET http://localhost:3000/health           → API Gateway
GET http://localhost:3001/health           → Auth Service
GET http://localhost:8000/api/health       → Inventory Service
GET http://localhost:3002/health           → Order Service
```

---

## Alur Request Antar Service

### Alur Login & Request Terproteksi

```
Client                  Gateway              Auth Service
  │                        │                     │
  │─── POST /api/auth/login ──────────────────────▶
  │                        │                     │
  │◀──────────── { accessToken, refreshToken } ───│
  │                        │                     │
  │─── GET /api/inventory/products               │
  │    Authorization: Bearer <token>             │
  │                        │                     │
  │             jwtValidator.js                  │
  │             verify token ✓                   │
  │             inject x-user-id, x-user-role    │
  │                        │                     │
  │                 proxy → Inventory Service
```

### Alur Buat Order (Inter-Service Call)

```
Client          Gateway         Order Svc       Inventory Svc
  │                │                │                 │
  │─ POST /api/orders ──────────────▶                 │
  │                │                │                 │
  │                │         getProduct(id) ──────────▶
  │                │                │◀── product data ┤
  │                │                │                 │
  │                │         reserveStock() ───────────▶
  │                │                │◀── stok berkurang│
  │                │                │                 │
  │                │         Order confirmed           │
  │◀───────────────│────────────────│                 │
```
