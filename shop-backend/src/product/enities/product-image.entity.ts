import {
    Check,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { Product } from "./product.entity";

@Entity("product_image")
@Check("CHK_image_sort", `"sortOrder" >= 0`)
export class ProductImage {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    url: string;

    @Column({ type: "int", default: 0 })
    sortOrder: number;

    @Index()
    @Column({ type: "uuid" })
    productId: string;

    @ManyToOne(() => Product, (p) => p.images, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "productId" })
    product: Product;
}
