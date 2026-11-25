import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";

import { ProductVariant } from "../../product/enities/product-variant.entity";
import { Cart } from "./cart.entity";

@Entity("cart_item")
@Unique("UQ_cart_item_cart_variant", ["cartId", "variantId"])
@Check("CHK_cart_item_qty", `"quantity" > 0`)
export class CartItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "int" })
    quantity: number;

    @Column({ type: "uuid" })
    cartId: string;

    @ManyToOne(() => Cart, (c) => c.items, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "cartId" })
    cart: Cart;

    @Index()
    @Column({ type: "uuid" })
    variantId: string;

    @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "variantId" })
    variant: ProductVariant;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;
}
