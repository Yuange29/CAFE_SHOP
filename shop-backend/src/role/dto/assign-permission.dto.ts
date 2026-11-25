import { ArrayNotEmpty, ArrayUnique, IsArray, IsUUID } from "class-validator";

export class AssignPermissionsDto {
    @IsArray()
    @ArrayNotEmpty()
    @ArrayUnique()
    @IsUUID("all", { each: true })
    permissionIds: string[];
}
