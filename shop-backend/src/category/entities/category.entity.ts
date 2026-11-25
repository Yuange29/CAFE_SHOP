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

import { Product } from "../../product/enities/product.entity";

@Entity("category")
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    name: string;

    @Column({ type: "text", unique: true })
    slug: string;

    @Index()
    @Column({ type: "uuid", nullable: true })
    parentId: string | null;

    @ManyToOne(() => Category, (c) => c.children, {
        nullable: true,
        onDelete: "RESTRICT",
    })
    @JoinColumn({ name: "parentId" })
    parent: Category | null;

    @OneToMany(() => Category, (c) => c.parent)
    children: Category[];

    @OneToMany(() => Product, (p) => p.category)
    products: Product[];

    @CreateDateColumn({ type: "timestamptz" })
    createDate: Date;

    @UpdateDateColumn({ type: "timestamptz" })
    updateDate: Date;
}
