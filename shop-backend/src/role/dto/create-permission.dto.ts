import { Transform } from "class-transformer";
import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class CreatePermissionDto {
    @Transform(({ value }) =>
        typeof value === "string" ? value.trim().toUpperCase() : value,
    )
    @IsString()
    @MaxLength(100)
    @Matches(/^[A-Z][A-Z0-9_]*$/, {
        message: "permissionCode phải IN HOA, dạng CREATE_PRODUCT",
    })
    permissionCode: string;

    /** Không truyền thì mặc định bằng permissionCode */
    @IsOptional()
    @IsString()
    @MaxLength(150)
    permissionName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;
}
