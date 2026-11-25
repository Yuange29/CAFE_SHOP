import { DataSource, EntityManager, In, Not } from "typeorm";

import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { isUniqueViolation, normalizeCode } from "../common/utils/db.util";
import { User } from "../user/entities/user.entity";
import { AssignPermissionsDto } from "./dto/assign-permission.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Permission } from "./entities/permission.entity";
import { RolePermission } from "./entities/role-permission.entity";
import { Role } from "./entities/role.entity";

const PROTECTED_ROLE_CODES = ["ADMIN", "CUSTOMER"];

@Injectable()
export class RoleService {
    constructor(private readonly dataSource: DataSource) {}

    // ---------- CRUD ----------

    async create(dto: CreateRoleDto) {
        const roleCode = normalizeCode(dto.roleCode);
        const roleName = dto.roleName?.trim() || roleCode;

        await this.assertUnique(roleCode, roleName);

        try {
            const roleId = await this.dataSource.transaction(async (em) => {
                const role = await em.save(
                    em.create(Role, {
                        roleCode,
                        roleName,
                        description: dto.description ?? null,
                        isActive: dto.isActive ?? true,
                    }),
                );
                if (dto.permissionIds?.length) {
                    await this.replacePermissions(
                        em,
                        role.id,
                        dto.permissionIds,
                    );
                }
                return role.id;
            });
            return this.findOne(roleId);
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictException(
                    "roleCode hoặc roleName đã tồn tại",
                );
            }
            throw error;
        }
    }

    async findAll() {
        const roles = await this.dataSource.manager.find(Role, {
            relations: { rolePermissions: { permission: true } },
            order: { roleCode: "ASC" },
        });
        return roles.map((role) => this.toResponse(role));
    }

    async findOne(id: string) {
        return this.toResponse(await this.findEntity(id, true));
    }

    async update(id: string, dto: UpdateRoleDto) {
        const role = await this.findEntity(id);

        if (dto.roleName !== undefined) {
            const roleName = dto.roleName.trim() || role.roleCode;
            if (roleName !== role.roleName) {
                await this.assertUnique(undefined, roleName, id);
                role.roleName = roleName;
            }
        }
        if (dto.description !== undefined) role.description = dto.description;
        if (dto.isActive !== undefined) role.isActive = dto.isActive;

        try {
            await this.dataSource.transaction(async (em) => {
                await em.save(role);
                if (dto.permissionIds !== undefined) {
                    await this.replacePermissions(em, id, dto.permissionIds);
                }
            });
        } catch (error) {
            if (isUniqueViolation(error)) {
                throw new ConflictException("roleName đã tồn tại");
            }
            throw error;
        }

        return this.findOne(id);
    }

    async remove(id: string): Promise<{ deleted: true }> {
        const role = await this.findEntity(id);

        if (PROTECTED_ROLE_CODES.includes(role.roleCode)) {
            throw new ForbiddenException(
                `Không thể xóa role hệ thống ${role.roleCode}`,
            );
        }

        // withDeleted: user đã xóa mềm vẫn giữ FK tới role (RESTRICT)
        const usersCount = await this.dataSource.getRepository(User).count({
            where: { roleId: id },
            withDeleted: true,
        });
        if (usersCount > 0) {
            throw new ConflictException(
                `Role đang được gán cho ${usersCount} người dùng, hãy chuyển họ sang role khác trước`,
            );
        }

        // role_permission xóa theo (ON DELETE CASCADE)
        await this.dataSource.manager.delete(Role, id);
        return { deleted: true };
    }

    // ---------- Gán / gỡ permission ----------

    /** Thêm permission vào role, bỏ qua cái đã có */
    async addPermissions(roleId: string, dto: AssignPermissionsDto) {
        await this.findEntity(roleId);

        await this.dataSource.transaction(async (em) => {
            await this.assertPermissionsExist(em, dto.permissionIds);
            await em
                .createQueryBuilder()
                .insert()
                .into(RolePermission)
                .values(
                    dto.permissionIds.map((permissionId) => ({
                        roleId,
                        permissionId,
                    })),
                )
                .orIgnore()
                .execute();
        });

        return this.findOne(roleId);
    }

    async removePermission(roleId: string, permissionId: string) {
        await this.findEntity(roleId);

        const result = await this.dataSource.manager.delete(RolePermission, {
            roleId,
            permissionId,
        });
        if (!result.affected) {
            throw new NotFoundException("Role không có permission này");
        }

        return this.findOne(roleId);
    }

    // ---------- helpers ----------

    private async findEntity(
        id: string,
        withPermissions = false,
    ): Promise<Role> {
        const role = await this.dataSource.manager.findOne(Role, {
            where: { id },
            relations: withPermissions
                ? { rolePermissions: { permission: true } }
                : {},
        });
        if (!role) throw new NotFoundException("Không tìm thấy role");
        return role;
    }

    private async assertUnique(
        roleCode: string | undefined,
        roleName: string,
        excludeId?: string,
    ) {
        const notSelf = excludeId ? { id: Not(excludeId) } : {};

        if (roleCode) {
            const byCode = await this.dataSource.manager.findOne(Role, {
                where: { roleCode, ...notSelf },
                select: { id: true },
            });
            if (byCode)
                throw new ConflictException(`Role ${roleCode} đã tồn tại`);
        }

        const byName = await this.dataSource.manager.findOne(Role, {
            where: { roleName, ...notSelf },
            select: { id: true },
        });
        if (byName)
            throw new ConflictException(`Tên role "${roleName}" đã tồn tại`);
    }

    private async assertPermissionsExist(em: EntityManager, ids: string[]) {
        if (!ids.length) return;
        const found = await em.count(Permission, { where: { id: In(ids) } });
        if (found !== new Set(ids).size) {
            throw new BadRequestException("Có permissionId không tồn tại");
        }
    }

    /** Đặt tập permission của role đúng bằng `ids` (xóa cũ, thêm mới) */
    private async replacePermissions(
        em: EntityManager,
        roleId: string,
        ids: string[],
    ) {
        const permissionIds = [...new Set(ids)];
        await this.assertPermissionsExist(em, permissionIds);

        await em.delete(RolePermission, { roleId });
        if (permissionIds.length) {
            await em.insert(
                RolePermission,
                permissionIds.map((permissionId) => ({ roleId, permissionId })),
            );
        }
    }

    private toResponse(role: Role) {
        const { rolePermissions, ...rest } = role;
        return {
            ...rest,
            permissions: (rolePermissions ?? []).map((rp) => rp.permission),
        };
    }
}
