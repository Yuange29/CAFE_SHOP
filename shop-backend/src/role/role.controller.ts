import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
} from "@nestjs/common";

import { AssignPermissionsDto } from "./dto/assign-permission.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RoleService } from "./role.service";

// TODO: gắn guard của bạn cho cả controller, ví dụ:
// @UseGuards(JwtAuthGuard, PermissionsGuard) + @RequirePermissions('ADMIN')
@Controller("roles")
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    create(@Body() dto: CreateRoleDto) {
        return this.roleService.create(dto);
    }

    @Get()
    findAll() {
        return this.roleService.findAll();
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.roleService.findOne(id);
    }

    @Patch(":id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
        return this.roleService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.roleService.remove(id);
    }

    @Post(":id/permissions")
    addPermissions(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: AssignPermissionsDto,
    ) {
        return this.roleService.addPermissions(id, dto);
    }

    @Delete(":id/permissions/:permissionId")
    removePermission(
        @Param("id", ParseUUIDPipe) id: string,
        @Param("permissionId", ParseUUIDPipe) permissionId: string,
    ) {
        return this.roleService.removePermission(id, permissionId);
    }
}
