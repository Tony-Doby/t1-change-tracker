# TDhome

Ứng dụng React/Vite theo dõi quy trình thay đổi T1. App dùng Supabase cho Auth, dữ liệu và Edge Functions; Google Drive được quản lý qua Apps Script proxy.

## Bắt đầu

```bash
npm install
npm run dev
```

Thiết lập `.env` với:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Kiểm tra

```bash
npm run test
npm run verify
```

`verify` chạy TypeScript, production build và ESLint. Không commit hoặc deploy nếu chưa có yêu cầu rõ ràng.

Ghi chú trạng thái: review ngày 2026-08-13 xác nhận `npm run build` và `npm run test` (98 tests) pass. Nếu `npm run lint` không kết thúc trong môi trường giới hạn thời gian, hãy chạy lại trong local/CI và chỉ ghi nhận pass khi có kết quả hoàn chỉnh.

## Tài liệu

- [Quy tắc làm việc](docs/AGENTS.md)
- [Technical knowledge & business rules](docs/KNOWLEDGE.md)
- [Tiến độ nhanh](docs/PROGRESS.md)
- [Changelog](docs/CHANGELOG.md)
- [Feature plans](docs/PLAN-feature-dev.md) và [bug plans](docs/PLAN-bug-fixes.md)

Lưu ý: migration SQL trong `supabase/migrations/` là file local; mọi schema change cho production phải chạy thủ công trong Supabase SQL Editor.
