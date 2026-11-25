import { Transform, TransformFnParams } from "class-transformer";
import { IsUrl, MaxLength } from "class-validator";

export const trim = ({ value }: TransformFnParams): unknown =>
    typeof value === "string" ? value.trim() : value;

export class CreateProductImage {
    @Transform(trim)
    @IsUrl({ protocols: ["http", "https"], require_protocol: true })
    @MaxLength(200)
    url: string;
}
