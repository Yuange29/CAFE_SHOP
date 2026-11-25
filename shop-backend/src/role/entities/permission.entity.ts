import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from "typeorm";

import { RolePermission } from "../../role/entities/role-permission.entity";

@Entity("permission")
export class Permission {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        name: "permission_code",
        type: "varchar",
        length: 100,
        unique: true,
    })
    permissionCode: string;

    @Column({ name: "permission_name", type: "varchar", length: 150 })
    permissionName: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    description: string | null;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @OneToMany(() => RolePermission, (rp) => rp.permission)
    rolePermissions: RolePermission[];
}
