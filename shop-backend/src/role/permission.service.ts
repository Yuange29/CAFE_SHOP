import { ILike, Repository } from "typeorm";

import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { isUniqueViolation, normalizeCode } from "../common/utils/db.util";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { Permission } from "./entities/permission.entity";

// Permission hệ thống, không cho xóa
const PROTECTED_PERMISSION_CODES = ["ADMIN"];

@Injectable()
export class PermissionService {
    constructor(
        @InjectRepository(Permission)
        private readonly permissionRepo: Repository<Permission>,
    ) {}

    async create(dto: CreatePermissionDto): Promise<Permission> {
        const permissionCode = normalizeCode(dto.permissionCode);

        const existed = await this.permissionRepo.findOne({
            where: { permissionCode },
            select: { id: true },
        });
        if (existed) {
            throw new ConflictException(
                `Permission ${permissionCode} đã tồn tại`,
            );
        }

        try {
            return await this.permissionRepo.save(
                this.permissionRepo.create({
                    permissionCode,
                    permissionName:
                        dto.permissionName?.trim() || permissionCode,
                    description: dto.description ?? null,
                }),
            );
        } catch (error) {
            // hai request tạo cùng lúc: unique ở DB là chốt chặn cuối
            if (isUniqueViolation(error)) {
                throw new ConflictException(
                    `Permission ${permissionCode} đã tồn tại`,
                );
            }
            throw error;
        }
    }

    async findAll(query: QueryPermissionDto) {
        const { page = 1, limit = 20, search } = query;
        const keyword = search?.trim();

        const [items, total] = await this.permissionRepo.findAndCount({
            where: keyword ? { permissionCode: ILike(`%${keyword}%`) } : {},
            order: { permissionCode: "ASC" },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total, page, limit };
    }

    async findOne(id: string): Promise<Permission> {
        const permission = await this.permissionRepo.findOne({ where: { id } });
        if (!permission)
            throw new NotFoundException("Không tìm thấy permission");
        return permission;
    }

    async update(id: string, dto: UpdatePermissionDto): Promise<Permission> {
        const permission = await this.findOne(id);

        if (dto.permissionName !== undefined) {
            permission.permissionName =
                dto.permissionName.trim() || permission.permissionCode;
        }
        if (dto.description !== undefined) {
            permission.description = dto.description;
        }

        return this.permissionRepo.save(permission);
    }

    async remove(id: string): Promise<{ deleted: true }> {
        const permission = await this.findOne(id);

        if (PROTECTED_PERMISSION_CODES.includes(permission.permissionCode)) {
            throw new ForbiddenException(
                `Không thể xóa permission hệ thống ${permission.permissionCode}`,
            );
        }

        // role_permission xóa theo (ON DELETE CASCADE): permission biến mất khỏi mọi role
        await this.permissionRepo.delete(id);
        return { deleted: true };
    }
}
