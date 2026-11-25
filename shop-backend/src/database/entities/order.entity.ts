import {
    Check,
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

import { decimalTransformer } from "../../common/utils/decimal-tranform.util";
import { User } from "../../user/entities/user.entity";
import { OrderItem } from "./order-item.entity";
import { OrderStatus, OrderStatusHistory } from "./order-status-history.entity";

const money = {
    type: "numeric" as const,
    precision: 12,
    scale: 2,
    transformer: decimalTransformer,
};

enum PaymentMethod {
    COD = "cod",
    BANK_TRANSFER = "bank_transfer",
}

enum PaymentStatus {
    UNPAID = "unpaid",
    PAID = "paid",
    REFUNDED = "refunded",
}

@Entity("orders")
@Index("IDX_orders_user_created", ["userId", "createDate"])
@Check(
    "CHK_orders_amounts",
    `"subtotal" >= 0 AND "discount" >= 0 AND "shippingFee" >= 0`,
)
@Check("CHK_orders_total", `"total" = "subtotal" - "discount" + "shippingFee"`)
export class Order {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text", unique: true })
    orderCode: string;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Index()
    @Column({
        type: "enum",
        enum: OrderStatus,
        enumName: "order_status",
        default: OrderStatus.PENDING,
    })
    orderStatus: OrderStatus;

    @Column({
        type: "enum",
        enum: PaymentMethod,
        enumName: "payment_method",
        default: PaymentMethod.COD,
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        enumName: "payment_status",
        default: PaymentStatus.UNPAID,
    })
    paymentStatus: PaymentStatus;

    @Column(money)
    subtotal: number;

    @Column({ ...money, default: 0 })
    discount: number;

    @Column({ ...money, default: 0 })
    shippingFee: number;

    @Column(money)
    total: number;

    // Snapshot địa chỉ giao hàng (không có bảng customer_address)
    @Column({ type: "text" })
    shippingRecipientName: string;

    @Column({ type: "text" })
    shippingRecipientPhone: string;

    @Column({ type: "text" })
    shippingAddressLine: string;

    @Column({ type: "text", nullable: true })
    shippingWard: string | null;

    @Column({ type: "text" })
    shippingProvince: string;

    @Column({ type: "text", nullable: true })
    customerNote: string | null;

    // Thay bảng delivery
    @Column({ type: "text", nullable: true })
    carrierName: string | null;

    @Column({ type: "text", nullable: true })
    trackingCode: string | null;

    @Column({ type: "timestamptz", nullable: true })
    completedAt: Date | null;

    @OneToMany(() => OrderItem, (i) => i.order)
    items: OrderItem[];

    // Ai duyệt/từ chối/hủy, khi nào, lý do -> lấy từ lịch sử
    @OneToMany(() => OrderStatusHistory, (h) => h.order)
    statusHistory: OrderStatusHistory[];

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;
}
