import { QueryFailedError } from "typeorm";

/** Lỗi vi phạm unique của Postgres (mã 23505) */
export function isUniqueViolation(error: unknown): boolean {
    return (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === "23505"
    );
}

/** "create_product " -> "CREATE_PRODUCT" */
export function normalizeCode(value: string): string {
    return value.trim().toUpperCase();
}

/** check foreign key error */
export function isForeignKeyViolation(error: unknown): boolean {
    return (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string } | undefined)?.code === "23503"
    );
}

/** Trả về tên cột bị trùng (vd "sku", "slug") nếu là lỗi unique, ngược lại null */
export function uniqueViolationField(error: unknown): string | null {
    if (!isUniqueViolation(error)) return null;
    const detail = (
        (error as QueryFailedError).driverError as
            | { detail?: string }
            | undefined
    )?.detail;
    return detail?.match(/^Key \((.+?)\)=/)?.[1] ?? null;
}
