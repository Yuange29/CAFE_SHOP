import { Transform } from "class-transformer";
import {
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
    IsUUID,
    Matches,
    MaxLength,
} from "class-validator";

export class CreateRoleDto {
    @Transform(({ value }) =>
        typeof value === "string" ? value.trim().toUpperCase() : value,
    )
    @IsString()
    @MaxLength(50)
    @Matches(/^[A-Z][A-Z0-9_]*$/, {
        message: "roleCode phải IN HOA, dạng ADMIN, CUSTOMER",
    })
    roleCode: string;

    /** Không truyền thì mặc định bằng roleCode */
    @IsOptional()
    @IsString()
    @MaxLength(100)
    roleName?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    /** Danh sách id permission gán cho role (một role có nhiều permission) */
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsUUID("all", { each: true })
    permissionIds?: string[];
}
