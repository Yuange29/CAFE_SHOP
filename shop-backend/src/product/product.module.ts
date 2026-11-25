import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Category } from "../category/entities/category.entity";
import { ProductImage } from "./enities/product-image.entity";
import { ProductVariant } from "./enities/product-variant.entity";
import { Product } from "./enities/product.entity";
import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Category,
            Product,
            ProductVariant,
            ProductImage,
        ]),
    ],
    controllers: [ProductController],
    providers: [ProductService],
})
export class ProductModule {}
