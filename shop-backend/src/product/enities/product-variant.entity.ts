import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { decimalTransformer } from "../../common/utils/decimal-tranform.util";
import { User } from "../../database/entities";
import { Product } from "./product.entity";

@Entity("product_variant")
@Check("CHK_variant_price", `"price" >= 0`)
@Check("CHK_variant_stock", `"stockQuantity" >= 0`)
export class ProductVariant {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text", unique: true })
    sku: string;

    @Column({ type: "text" })
    name: string;

    @Column({
        type: "numeric",
        precision: 12,
        scale: 2,
        transformer: decimalTransformer,
    })
    price: number;

    @Column({ type: "int", default: 0 })
    stockQuantity: number;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Index()
    @Column({ type: "uuid" })
    productId: string;

    @ManyToOne(() => Product, (p) => p.variants, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "productId" })
    product: Product;

    @Column({ type: "uuid", nullable: true })
    updateBy: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "updateBy" })
    updater: User | null;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;
}
