import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { Category } from "../../category/entities/category.entity";
import { User } from "../../user/entities/user.entity";
import { ProductImage } from "./product-image.entity";
import { ProductVariant } from "./product-variant.entity";

export enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    ARCHIVED = "archived", // thay cho deleteDate (xóa mềm)
}

@Entity("product")
export class Product {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "text", unique: true })
    slug: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "text", nullable: true })
    brand: string | null;

    @Column({ type: "text", nullable: true })
    origin: string | null;

    // Thay bảng product_attribute: thuộc tính tự do (độ rang, vùng trồng...)
    @Column({ type: "jsonb", default: () => `'{}'` })
    attributes: Record<string, string>;

    @Index()
    @Column({
        type: "enum",
        enum: ProductStatus,
        enumName: "product_status",
        default: ProductStatus.ACTIVE,
    })
    status: ProductStatus;

    @Index()
    @Column({ type: "uuid" })
    categoryId: string;

    @ManyToOne(() => Category, (c: Category) => c.products, {
        nullable: false,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "categoryId" })
    category: Category;

    @Column({ type: "uuid", nullable: true })
    createdBy: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "createdBy" })
    creator: User | null;

    @Column({ type: "uuid", nullable: true })
    updatedBy: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "updatedBy" })
    updater: User | null;

    @OneToMany(() => ProductVariant, (v) => v.product)
    variants: ProductVariant[];

    @OneToMany(() => ProductImage, (i) => i.product)
    images: ProductImage[];

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;
}
