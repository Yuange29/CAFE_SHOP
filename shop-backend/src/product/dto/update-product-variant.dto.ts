import { Transform } from "class-transformer";
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsString,
    Max,
    MaxLength,
    Min,
    ValidateIf,
} from "class-validator";

import { trim } from "./create-product-image.dto";

/**
 * PATCH thông tin variant (chỉ manager).
 * Không có sku (mã định danh, không đổi) và stockQuantity (có API riêng).
 * Không gửi = giữ nguyên; null không hợp lệ.
 */
export class UpdateVariantDto {
    @ValidateIf((_, v) => v !== undefined)
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name?: string;

    @ValidateIf((_, v) => v !== undefined)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(9_999_999_999)
    price?: number;

    @ValidateIf((_, v) => v !== undefined)
    @IsBoolean()
    isActive?: boolean;
}
