import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
} from "@nestjs/common";

import { CategoryService } from "./category.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Controller("category")
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    async createCategory(@Body() dto: CreateCategoryDto) {
        return await this.categoryService.createCategory(dto);
    }

    @Get("slug/:slug")
    async getBySlug(@Param("slug") slug: string) {
        return await this.categoryService.getBySlug(slug);
    }

    @Get("tree")
    async getTree() {
        return await this.categoryService.getTree();
    }

    @Patch(":id")
    async updateCategory(
        @Param("id") id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return await this.categoryService.updateCategory(id, dto);
    }

    @Delete(":id")
    async removeCategory(@Param("id") id: string) {
        return await this.categoryService.removeCategory(id);
    }
}
