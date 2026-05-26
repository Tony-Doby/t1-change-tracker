# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị

1. Đảm bảo code đã push lên GitHub
2. Tạo tài khoản Vercel miễn phí tại [vercel.com](https://vercel.com)

## Bước 2: Import Project

1. Vào Vercel Dashboard → **Add New Project**
2. Chọn repository `track-t1-changes/webapp` (hoặc repo của bạn)
3. Framework Preset: chọn **Vite**
4. Root Directory: để trống (hoặc chọn `webapp` nếu repo gốc)

## Bước 3: Thêm Environment Variables

Vào phần **Environment Variables**, thêm 2 biến:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://cikfyhmcspvflxlyyplo.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` (lấy từ file `.env`) |

> **Lưu ý**: Không commit file `.env` lên GitHub. Chỉ thêm env vars trong Vercel Dashboard.

## Bước 4: Deploy

1. Bấm **Deploy**
2. Chờ ~1 phút để build hoàn tất
3. Vercel sẽ cấp URL dạng `https://your-project.vercel.app`

## Bước 5: Cấu hình Supabase (quan trọng)

Vào Supabase Dashboard → Authentication → URL Configuration:

- **Site URL**: `https://your-project.vercel.app`
- **Redirect URLs**: Thêm `https://your-project.vercel.app/*`

Nếu không cấu hình, auth redirect sau login sẽ bị lỗi.

## Backup Data

Định kỳ export backup từ Supabase Dashboard:
1. Vào **Table Editor**
2. Chọn bảng cần backup
3. Bấm **Export** → CSV

Hoặc dùng SQL: Vào **SQL Editor** → chạy query SELECT rồi export.
