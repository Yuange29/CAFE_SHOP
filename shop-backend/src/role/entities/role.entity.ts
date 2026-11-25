import {
    Column,
    CreateDateColumn,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { User } from "../../user/entities/user.entity";
import { RolePermission } from "./role-permission.entity";

@Entity("role")
export class Role {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ name: "role_code", type: "varchar", length: 50, unique: true })
    roleCode: string;

    @Column({ name: "role_name", type: "varchar", length: 100, unique: true })
    roleName: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    description: string | null;

    @Column({ name: "is_active", type: "boolean", default: true })
    isActive: boolean;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;

    @OneToMany(() => User, (user) => user.role)
    users: User[];

    @OneToMany(() => RolePermission, (rp) => rp.role)
    rolePermissions: RolePermission[];
}
