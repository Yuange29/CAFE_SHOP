import { Transform, TransformFnParams } from "class-transformer";
import {
    IsEnum,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateIf,
} from "class-validator";

import { IsStringRecord } from "../../common/decorators/IsStringRecord.decorator";
import { ProductStatus } from "../enities/product.entity";
import { trim } from "./create-product-image.dto";

export class UpdateProductDto {
    @ValidateIf((_, v) => v !== undefined)
    @Transform(trim)
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(5000)
    description?: string | null;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    brand?: string | null;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    origin?: string | null;

    @ValidateIf((_, v) => v !== undefined)
    @IsStringRecord()
    attributes?: Record<string, string>;

    @ValidateIf((_, v) => v !== undefined)
    @IsUUID()
    categoryId?: string;

    @ValidateIf((_, v) => v !== undefined)
    @IsEnum(ProductStatus)
    status?: ProductStatus;
}
