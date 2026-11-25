import { IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateCategoryDto {
    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @MinLength(3)
    @IsOptional()
    slug: string;

    @IsUUID()
    @IsOptional()
    parentId: string | null;
}
