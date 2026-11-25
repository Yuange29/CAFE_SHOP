/**
 * Seed role + permission mặc định. Chạy lại nhiều lần vẫn an toàn (idempotent):
 * chỉ tạo cái còn thiếu, không xóa/ghi đè gì đã có.
 *
 * Chạy:  npx ts-node -r tsconfig-paths/register src/database/seeds/seed-roles.ts
 * (hoặc thêm script "seed:roles" vào package.json)
 */

import { DataSource, In } from "typeorm";

import { NestFactory } from "@nestjs/core";

import { AppModule } from "../../app.module";
import { Permission } from "../../role/entities/permission.entity";
import { RolePermission } from "../../role/entities/role-permission.entity";
import { Role } from "../../role/entities/role.entity";

const PERMISSIONS: { permissionCode: string; description: string }[] = [
    { permissionCode: "ADMIN", description: "Toàn quyền hệ thống" },
    { permissionCode: "VIEW_PRODUCT", description: "Xem sản phẩm" },
    { permissionCode: "GET_ORDER", description: "Lấy/xem đơn hàng của mình" },
    { permissionCode: "CREATE_ORDER", description: "Đặt hàng" },
];

const ROLES: {
    roleCode: string;
    description: string;
    permissionCodes: string[];
}[] = [
    {
        roleCode: "ADMIN",
        description: "Quản trị viên",
        permissionCodes: ["ADMIN"],
    },
    {
        roleCode: "CUSTOMER",
        description: "Khách hàng",
        permissionCodes: ["VIEW_PRODUCT", "GET_ORDER", "CREATE_ORDER"],
    },
];

async function seed(dataSource: DataSource) {
    await dataSource.transaction(async (em) => {
        // 1. permissions
        for (const p of PERMISSIONS) {
            const existed = await em.findOne(Permission, {
                where: { permissionCode: p.permissionCode },
            });
            if (!existed) {
                await em.save(
                    em.create(Permission, {
                        permissionCode: p.permissionCode,
                        permissionName: p.permissionCode,
                        description: p.description,
                    }),
                );
                console.log(`+ permission ${p.permissionCode}`);
            }
        }

        // 2. roles + liên kết role_permission
        for (const r of ROLES) {
            let role = await em.findOne(Role, {
                where: { roleCode: r.roleCode },
            });
            if (!role) {
                role = await em.save(
                    em.create(Role, {
                        roleCode: r.roleCode,
                        roleName: r.roleCode,
                        description: r.description,
                        isActive: true,
                    }),
                );
                console.log(`+ role ${r.roleCode}`);
            }

            const permissions = await em.find(Permission, {
                where: { permissionCode: In(r.permissionCodes) },
            });

            if (permissions.length !== r.permissionCodes.length) {
                throw new Error(`Thiếu permission cho role ${r.roleCode}`);
            }

            // orIgnore: link đã có thì bỏ qua, không đụng permission thêm tay
            await em
                .createQueryBuilder()
                .insert()
                .into(RolePermission)
                .values(
                    permissions.map((p) => ({
                        roleId: role!.id,
                        permissionId: p.permissionCode,
                    })),
                )
                .orIgnore()
                .execute();
        }
    });
}

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ["error", "warn"],
    });
    try {
        await seed(app.get(DataSource));
        console.log("Seed role/permission xong.");
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
