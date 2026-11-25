import { OmitType, PartialType } from "@nestjs/mapped-types";

import { CreatePermissionDto } from "./create-permission.dto";

// permissionCode không cho đổi: code/guard đang tham chiếu theo mã này
export class UpdatePermissionDto extends PartialType(
    OmitType(CreatePermissionDto, ["permissionCode"] as const),
) {}
