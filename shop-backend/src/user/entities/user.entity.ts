import {
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Role } from "../../role/entities/role.entity";

export enum AccountStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    LOCKED = "LOCKED",
    PENDING_VERIFICATION = "PENDING_VERIFICATION",
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
        name: "full_name",
        type: "varchar",
        length: 200,
        default: "Customer",
    })
    fullName!: string;

    @Column({ type: "varchar", length: 254, unique: true })
    email: string;

    @Column({ type: "varchar", length: 30, nullable: true })
    phone: string | null;

    @Column({
        name: "password_hash",
        type: "varchar",
        length: 255,
        select: false,
    })
    passwordHash: string;

    @Column({
        name: "hash_token",
        type: "varchar",
        length: 255,
        nullable: true,
        select: false,
    })
    hashToken: string | null;

    @Column({
        name: "account_status",
        type: "enum",
        enum: AccountStatus,
        enumName: "account_status",
        default: AccountStatus.ACTIVE,
    })
    accountStatus: AccountStatus;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    // đổi updatedAt (timestamp) -> updateDate (timestamptz) cho đồng bộ
    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;

    @DeleteDateColumn({ type: "timestamptz", nullable: true })
    deleteDate: Date | null;

    @Column({ name: "role_id", type: "uuid" })
    roleId: string;

    @ManyToOne(() => Role, (role) => role.users, {
        nullable: false,
        onDelete: "RESTRICT",
        onUpdate: "RESTRICT",
    })
    @JoinColumn({ name: "role_id", referencedColumnName: "id" })
    role: Role;
}
