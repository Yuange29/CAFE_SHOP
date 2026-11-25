import { Transform, Type } from "class-transformer";
import {
    ArrayMaxSize,
    ArrayMinSize,
    ArrayUnique,
    IsArray,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    MinLength,
    ValidateNested,
} from "class-validator";

import { IsStringRecord } from "../../common/decorators/IsStringRecord.decorator";
import { ProductImage } from "../enities/product-image.entity";
import { ProductVariant } from "../enities/product-variant.entity";
import { CreateProductImage, trim } from "./create-product-image.dto";
import { CreateProductVariant } from "./create-product-variant.dto";

export class CreateProductDto {
    @Transform(trim)
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    name: string;

    @Transform(trim)
    @IsString()
    @MinLength(2)
    @MaxLength(200)
    @IsOptional()
    slug?: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(5000)
    description: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    brand: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(100)
    origin: string;

    @IsOptional()
    @IsStringRecord()
    /** như: "ĐỘ RANG": "Vừa"  */
    attributes: Record<string, string>;

    @IsUUID()
    categoryId: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ArrayUnique((v: CreateProductVariant) => v.sku, {
        message: "SKU is existed",
    })
    @ValidateNested({ each: true })
    @Type(() => CreateProductVariant)
    variants: ProductVariant[];

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => CreateProductImage)
    images: ProductImage[];
}
