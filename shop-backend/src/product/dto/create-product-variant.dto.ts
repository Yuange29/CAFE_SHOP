import { Transform } from "class-transformer";
import {
    IsBoolean,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    Max,
    MaxLength,
    Min,
} from "class-validator";

import { trim } from "./create-product-image.dto";

export class CreateProductVariant {
    @Transform(({ value }) =>
        typeof value === "string" ? value.trim().toUpperCase() : value,
    )
    @IsString()
    @MaxLength(50)
    @Matches(/^[A-Z0-9][A-Z0-9_-]*$/, {
        message: "slu only includes alphabet, numbber and _ -",
    })
    sku: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    name: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(9_999_999_999)
    price: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(1_000_000)
    stockQuantity?: number;

    @IsOptional()
    @IsBoolean()
    isActive: boolean;
}
