import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";
import { Role } from "./entities/role.entity";
import { PermissionController } from "./permission.controller";
import { PermissionService } from "./permission.service";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";

@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission])],
    controllers: [RoleController, PermissionController],
    providers: [RoleService, PermissionService],
    exports: [RoleService],
})
export class RoleModule {}
