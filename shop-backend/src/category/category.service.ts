import { Not, Repository } from "typeorm";

import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import {
    isForeignKeyViolation,
    isUniqueViolation,
} from "../common/utils/db.util";
import { slugify } from "../common/utils/slug.util";
import { Product } from "../product/enities/product.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { Category } from "./entities/category.entity";

export type CategoryNode = {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    children: CategoryNode[];
};

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,

        @InjectRepository(Product)
        private readonly productCategory: Repository<Product>,
    ) {}

    async createCategory(dto: CreateCategoryDto) {
        const name = dto.name.trim();
        const slug = slugify(dto.name);
        if (!name || !slug) throw new Error("Category name is required");

        if (dto.parentId) {
            const parentExists = await this.categoryRepository.exists({
                where: { id: dto.parentId },
            });
            if (!parentExists)
                throw new NotFoundException("Parent category not found");
        }

        if (await this.categoryRepository.exists({ where: { slug } }))
            throw new ConflictException("Category name or slug already exists");

        try {
            return await this.categoryRepository.save(
                this.categoryRepository.create({
                    name,
                    slug,
                    parentId: dto.parentId ?? null,
                }),
            );
        } catch (error) {
            if (isUniqueViolation(error))
                throw new ConflictException(
                    "Category name or slug already exists",
                );
            throw error;
        }
    }

    async getBySlug(slug: string) {
        const rows = await this.categoryRepository.find();
        const byIds = new Map(rows.map((r) => [r.id, r]));

        const current = rows.find((r) => r.slug === slug);
        if (!current) throw new NotFoundException("Category not found");

        const breakcrumb: { id: string; name: string; slug: string }[] = [];
        for (
            let c: Category | undefined = current;
            c;
            c = c.parentId ? byIds.get(c.parentId) : undefined
        ) {
            breakcrumb.unshift({
                id: c.id,
                name: c.name,
                slug: c.slug,
            });
            if (!c.parentId) break;
        }

        return {
            ...current,
            breakcrumb,
            children: rows.filter((r) => r.parentId === current.id),
        };
    }

    async getTree() {
        const rows = await this.categoryRepository.find({
            select: ["id", "name", "slug", "parentId"],
            order: { name: "ASC" },
        });

        const nodes = new Map<string, CategoryNode>(
            rows.map((r) => [r.id, { ...r, children: [] }]),
        );

        const roots: CategoryNode[] = [];
        for (const node of nodes.values()) {
            const parent = node.parentId ? nodes.get(node.parentId) : undefined;
            (parent ? parent.children : roots).push(node);
        }

        return roots;
    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {
        const category = await this.categoryRepository.findOne({
            where: { id },
        });

        if (!category) throw new NotFoundException("Category not found");

        if (dto.name !== undefined) {
            const name = dto.name.trim();
            const slug = slugify(dto.name);
            if (!slug)
                throw new BadRequestException("Category name is required");

            const duplicate = await this.categoryRepository.exists({
                where: { slug: slug, id: Not(id) },
            });

            if (duplicate)
                throw new BadRequestException(
                    "Category with this name already exists",
                );

            category.name = name;
        }

        if (dto.parentId !== undefined && dto.parentId !== category.parentId) {
            if (dto.parentId !== null)
                await this.assertValidParent(id, dto.parentId);
            category.parentId = dto.parentId;
        }

        return await this.categoryRepository.save(category);
    }

    async removeCategory(id: string) {
        const exist = await this.categoryRepository.exists({ where: { id } });
        if (!exist) throw new NotFoundException("Category not found");

        const hasChildren = await this.categoryRepository.exists({
            where: { parentId: id },
        });

        if (hasChildren)
            throw new ConflictException("Category still has sub-category");

        const hasProduct = await this.productCategory.exists({
            where: { categoryId: id },
        });

        if (hasProduct)
            throw new ConflictException("Category still has products");

        try {
            await this.categoryRepository.delete(id);
        } catch (error) {
            if (isForeignKeyViolation(error))
                throw new ConflictException(
                    "category is still referenced by other data",
                );

            throw error;
        }

        return { message: "Category removed" };
    }

    private async assertValidParent(id: string, parentId: string) {
        if (parentId === id)
            throw new BadRequestException("category can not be its own parent");

        const rows = await this.categoryRepository.find({
            select: { id: true, parentId: true },
        });

        const parentOf = new Map(rows.map((c) => [c.id, c.parentId]));

        if (!parentOf.has(parentId))
            throw new NotFoundException("parent can not be found");

        for (
            let cur: string | null | undefined = parentId;
            cur;
            cur = parentOf.get(cur)
        ) {
            if (cur === id) {
                throw new ConflictException(
                    "cannot  move a category  under its own descendant",
                );
            }
        }
    }
}
