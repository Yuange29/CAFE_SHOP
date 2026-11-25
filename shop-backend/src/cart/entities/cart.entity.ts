import {
    Column,
    Entity,
    JoinColumn,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";

import { User } from "../../user/entities/user.entity";
import { CartItem } from "./cart-item.entity";

@Entity("cart")
export class Cart {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid", unique: true })
    userId: string;

    @OneToOne(() => User, { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @OneToMany(() => CartItem, (i) => i.cart)
    items: CartItem[];

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;
}
