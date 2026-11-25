import {
    Check,
    Column,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";

import { decimalTransformer } from "../../common/utils/decimal-tranform.util";
import { ProductVariant } from "../../product/enities/product-variant.entity";
import { Order } from "./order.entity";

@Entity("order_item")
@Unique("UQ_order_item_order_variant", ["orderId", "variantId"])
@Check("CHK_order_item_qty", `"quantity" > 0`)
@Check("CHK_order_item_price", `"unitPrice" >= 0`)
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // đã được phủ bởi unique (orderId, variantId)
    @Column({ type: "uuid" })
    orderId: string;

    @ManyToOne(() => Order, (o) => o.items, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "orderId" })
    order: Order;

    @Index()
    @Column({ type: "uuid" })
    variantId: string;

    // RESTRICT: variant đã từng bán thì không xóa cứng được (hãy isActive=false)
    @ManyToOne(() => ProductVariant, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "variantId" })
    variant: ProductVariant;

    // Snapshot tại thời điểm đặt hàng
    @Column({ type: "text" })
    productNameSnapshot: string;

    @Column({ type: "text" })
    variantNameSnapshot: string;

    @Column({
        type: "numeric",
        precision: 12,
        scale: 2,
        transformer: decimalTransformer,
    })
    unitPrice: number;

    @Column({ type: "int" })
    quantity: number;
    // lineTotal = unitPrice * quantity -> tính khi cần, không lưu
}
