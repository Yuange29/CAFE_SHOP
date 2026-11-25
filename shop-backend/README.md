# Shop Backend

Backend khởi tạo cho website thương mại điện tử: NestJS + TypeScript + TypeORM + PostgreSQL.

## Hiện trạng

- Đã dựng cấu hình NestJS, ConfigModule, TypeORM DataSource và môi trường `.env` cho PostgreSQL (mặc định cổng `5432`).
- Đã tạo Entity nền tảng theo `database.txt`: ROLE, USER, PERMISSION, ROLE_PERMISSION, CATEGORY, PRODUCT, PRODUCT_VARIANT, INVENTORY, STOCK_MOVEMENT.
- Bigint ID được map thành `string` trong TypeScript để tránh mất chính xác số nguyên lớn. Các cột dùng kiểu tương thích PostgreSQL.
- DECIMAL được map thành `string`; không dùng `number` cho tiền.
- `synchronize` hiện bật cho môi trường phát triển; production nên tắt và quản lý schema bằng migration.
- `USER.password_hash` có `select: false` để tránh trả trường hash trong truy vấn thông thường.

## Chạy local

1. Cài Node.js LTS và PostgreSQL.
2. Tạo database và user PostgreSQL riêng; cấp quyền tối thiểu cho database của app.
3. Copy `.env.example` thành `.env`, cập nhật credential.
4. Chạy `npm install`.
5. Chạy `npm run build` để kiểm tra compile.

## Migration

Sau khi cài dependencies và cấu hình database, dùng TypeORM migration. Không bật `synchronize` trong môi trường có dữ liệu; đặt `synchronize: false` trước khi chạy production.

## Lưu ý thiết kế

Tài liệu BE và database thống nhất rằng mỗi USER có đúng một role chính (`USER.role_id`), không có `USER_ROLE`. Bản DDL database là nguồn cho tên cột và cấu trúc Entity. Các Entity nghiệp vụ còn lại (cart, order, delivery, payment, invoice...) sẽ được bổ sung theo từng nhóm tiếp theo.
