import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Product } from "../product/enities/product.entity";
import { CategoryController } from "./category.controller";
import { CategoryService } from "./category.service";
import { Category } from "./entities/category.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Category, Product])],
    controllers: [CategoryController],
    providers: [CategoryService],
})
export class CategoryModule {}
