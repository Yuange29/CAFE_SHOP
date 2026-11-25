import { OmitType, PartialType } from "@nestjs/mapped-types";

import { CreateRoleDto } from "./create-role.dto";

// roleCode không cho đổi: guard/seed tham chiếu theo mã này.
// Nếu truyền permissionIds thì THAY THẾ toàn bộ permission của role.
export class UpdateRoleDto extends PartialType(
    OmitType(CreateRoleDto, ["roleCode"] as const),
) {}
