import {
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "typeorm";

import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

@Entity("role_permission")
export class RolePermission {
    @PrimaryColumn({ name: "role_id", type: "uuid" })
    roleId: string;

    @Index()
    @PrimaryColumn({ name: "permission_id", type: "uuid" })
    permissionId: string;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @ManyToOne(() => Role, (role) => role.rolePermissions, {
        nullable: false,
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
    })
    @JoinColumn({ name: "role_id", referencedColumnName: "id" })
    role: Role;

    @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
        nullable: false,
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
    })
    @JoinColumn({ name: "permission_id", referencedColumnName: "id" })
    permission: Permission;
}
