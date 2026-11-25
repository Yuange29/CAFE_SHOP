import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "../../user/entities/user.entity";
import { Order } from "./order.entity";

export enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    READY_FOR_DELIVERY = "ready_for_delivery",
    COMPLETED = "completed",
    REJECTED = "rejected",
    CANCELLED = "cancelled",
}

@Entity("order_status_history")
@Index("IDX_order_history_order_created", ["orderId", "createDate"])
export class OrderStatusHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    orderId: string;

    @ManyToOne(() => Order, (o) => o.statusHistory, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "orderId" })
    order: Order;

    @Column({
        type: "enum",
        enum: OrderStatus,
        enumName: "order_status",
        nullable: true,
    })
    fromStatus: OrderStatus | null;

    @Column({ type: "enum", enum: OrderStatus, enumName: "order_status" })
    toStatus: OrderStatus;

    @Column({ type: "uuid", nullable: true })
    changedBy: string | null;

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "changedBy" })
    changer: User | null;

    @Column({ type: "text", nullable: true })
    reason: string | null;

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;
}
