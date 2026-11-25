import { DataSource, Not, Repository } from "typeorm";

import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Category } from "../category/entities/category.entity";
import { uniqueViolationField } from "../common/utils/db.util";
import { slugify } from "../common/utils/slug.util";
import { AdjustStockDto } from "./dto/adjust-variant.dto";
import { CreateProductImage } from "./dto/create-product-image.dto";
import { CreateProductVariant } from "./dto/create-product-variant.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateVariantDto } from "./dto/update-product-variant.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductImage } from "./enities/product-image.entity";
import { ProductVariant } from "./enities/product-variant.entity";
import { Product, ProductStatus } from "./enities/product.entity";

const MAX_VARIANTS_PER_PRODUCT = 50;
const MAX_IMAGES_PER_PRODUCT = 20;

@Injectable()
export class ProductService {
    constructor(private readonly dataSource: DataSource) {}

    /**
     * create new product
     * @param dto CreateProductDto
     * @param userId Created user
     * @returns product + variant + image infomation
     */
    async createProduct(dto: CreateProductDto, userId: string) {
        const slug = slugify(dto.name.trim()) || dto.name.trim();
        if (!slug) throw new BadRequestException("Invalid product name");

        try {
            return await this.dataSource.transaction(async (manager) => {
                const category = await manager.getRepository(Category).exists({
                    where: { id: dto.categoryId },
                });
                if (!category)
                    throw new NotFoundException("category not found");

                const productRepository = manager.getRepository(Product);
                if (await productRepository.exists({ where: { slug } }))
                    throw new ConflictException("slug already exists");

                const product = await manager.save(
                    Product,
                    manager.create(Product, {
                        name: dto.name.trim(),
                        slug,
                        description: dto.description?.trim() || null,
                        brand: dto.brand ?? null,
                        origin: dto.origin ?? null,
                        attributes: dto.attributes ?? {},
                        categoryId: dto.categoryId,
                        status: ProductStatus.DRAFT,
                        createdBy: userId,
                    }),
                );

                await manager.insert(
                    ProductVariant,
                    dto.variants.map((v) => ({
                        productId: product.id,
                        name: v.name.trim(),
                        sku: v.sku,
                        price: v.price,
                        stockQuantity: v.stockQuantity ?? 0,
                        isActive: v.isActive ?? true,
                    })),
                );

                if (dto.images?.length) {
                    await manager.insert(
                        ProductImage,
                        dto.images.map((img, index) => ({
                            productId: product.id,
                            url: img.url,
                            sortOrder: index,
                        })),
                    );
                }

                return manager.findOneOrFail(Product, {
                    where: { id: product.id },
                    relations: { variants: true, images: true },
                    order: { images: { sortOrder: "ASC" } },
                });
            });
        } catch (error) {
            const field = uniqueViolationField(error);
            if (field)
                throw new ConflictException(
                    `${field.toUpperCase()} already exists`,
                );
            throw error;
        }
    }

    /**
     * update product infomation
     * @param dto Update product Dto
     * @param id product id
     * @param userId user who adjust
     * @returns product new infomation
     */
    async updateProductDetails(
        dto: UpdateProductDto,
        id: string,
        userId: string,
    ) {
        return this.dataSource.transaction(async (manager) => {
            let product = await manager.findOne(Product, {
                where: { id: id },
                lock: { mode: "pessimistic_write" },
            });
            if (!product) throw new NotFoundException("Product not found");

            if (dto.name !== undefined) {
                if (!slugify(dto.name))
                    throw new BadRequestException("Invalid product name");
                product.name = dto.name;
            }

            if (dto.description !== undefined)
                product.description = dto.description;
            if (dto.brand !== undefined) product.brand = dto.brand;
            if (dto.origin !== undefined) product.origin = dto.origin;
            if (dto.attributes !== undefined)
                product.attributes = dto.attributes;

            if (
                dto.categoryId !== undefined &&
                dto.categoryId !== product.categoryId
            ) {
                const category = await manager.exists(Category, {
                    where: { id: dto.categoryId },
                });

                if (!category)
                    throw new NotFoundException("Category not found");
                product.categoryId = dto.categoryId;
            }

            if (dto.status !== undefined && dto.status !== product.status) {
                const hasActiveVariant = await manager.exists(ProductVariant, {
                    where: { productId: product.id, isActive: true },
                });

                if (!hasActiveVariant)
                    throw new ConflictException(
                        "Product needs at least one active variant to be active",
                    );

                product.status = dto.status;
            }

            product.updatedBy = userId;

            return await manager.save(product);
        });
    }

    /**
     * manager update variant detail infomation
     * Require: role manager + permission: update variant
     * @param id variant id
     * @param dto UpdateProductDto
     * @param userId who update this product
     * @returns new variant infomation
     */
    async updateVariantDetail(
        id: string,
        dto: UpdateVariantDto,
        userId: string,
    ) {
        if (Object.keys(dto).length === 0)
            throw new BadRequestException("No fields to update");
        return await this.dataSource.transaction(async (manager) => {
            const variant = await manager.findOne(ProductVariant, {
                where: { id },
                lock: { mode: "pessimistic_write" },
            });
            if (!variant) throw new NotFoundException("Variant not found");

            if (dto.isActive == false && variant.isActive) {
                const product = await manager.findOneOrFail(Product, {
                    where: { id: variant.productId },
                    lock: { mode: "pessimistic_write" },
                });

                if (product.status == ProductStatus.ACTIVE) {
                    const ortherActive = await manager.count(ProductVariant, {
                        where: {
                            productId: variant.productId,
                            isActive: true,
                            id: Not(id),
                        },
                    });
                    if (ortherActive === 0)
                        throw new ConflictException(
                            "Can not deactive the last active variant of this product",
                        );
                }
            }

            if (dto.name !== undefined) variant.name = dto.name;
            if (dto.price !== undefined) variant.price = dto.price;
            if (dto.isActive !== undefined) variant.isActive = dto.isActive;
            variant.updateBy = userId;

            const saved = await manager.save(variant);

            await manager.update(Product, variant.productId, {
                updatedBy: userId,
            });

            return saved;
        });
    }

    /**
     * update stock
     * REQUIRED: role !== guest && customer
     * @param id variant id
     * @param userId user who update this variant
     * @param dto Adjust stocl dto
     * @returns variant info
     */
    async adjustVariantStock(id: string, userId: string, dto: AdjustStockDto) {
        return await this.dataSource.transaction(async (manager) => {
            const variant = await manager.findOne(ProductVariant, {
                where: { id },
                lock: { mode: "pessimistic_write" },
            });
            if (!variant) throw new NotFoundException("Variant not found");

            const next = variant.stockQuantity + dto.delta;
            if (next < 0) {
                throw new ConflictException(
                    `Insufficient stock:  ${variant.stockQuantity}, change ${dto.delta}`,
                );
            }

            variant.stockQuantity = next;
            variant.updateBy = userId;

            const saved = await manager.save(variant);
            await manager.update(Product, variant.productId, {
                updatedBy: userId,
            });
            return saved;
        });
    }

    /**
     * add new variant by product id
     * @param productId
     * @param dto : Creat Product variant
     * @param userId: user who created this variant == update this product
     * @returns new variant infomation
     */
    async addNewVariant(
        productId: string,
        dto: CreateProductVariant,
        userId: string,
    ) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const product = await manager.exists(Product, {
                    where: { id: productId },
                });
                if (!product) throw new NotFoundException("Product not found");

                const variantCount = await manager.count(ProductVariant, {
                    where: { productId },
                });
                if (variantCount >= MAX_VARIANTS_PER_PRODUCT)
                    throw new ConflictException(
                        `A product can have at most ${MAX_VARIANTS_PER_PRODUCT} variants`,
                    );

                const variant = await manager.save(
                    manager.create(ProductVariant, {
                        productId,
                        sku: dto.sku,
                        name: dto.name,
                        price: dto.price,
                        stockQuantity: dto.stockQuantity ?? 0,
                        isActive: dto.isActive ?? true,
                        updatedBy: userId,
                    }),
                );

                await manager.update(Product, productId, { updatedBy: userId });
                return variant;
            });
        } catch (error) {
            const field = uniqueViolationField(error);
            if (field)
                throw new BadRequestException(
                    `${field.toUpperCase()} already exist`,
                );
            throw new BadRequestException(error);
        }
    }

    /**
     *new image for product
     * @param productId
     * @param dto : dto: {url belong to this product}
     * @param userId who add this image
     * @returns
     */
    async addNewImage(
        productId: string,
        dto: CreateProductImage,
        userId: string,
    ) {
        return await this.dataSource.transaction(async (manager) => {
            const product = await manager.exists(Product, {
                where: { id: productId },
                select: { id: true },
                lock: { mode: "pessimistic_write" },
            });
            if (!product) throw new NotFoundException("Product not found");

            const count = await manager.count(ProductImage, {
                where: { productId: productId },
            });
            if (count >= MAX_IMAGES_PER_PRODUCT)
                throw new ConflictException(
                    `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images`,
                );

            const maxSort = await manager.maximum(ProductImage, "sortOrder", {
                productId,
            });

            const image = await manager.save(
                manager.create(ProductImage, {
                    productId,
                    url: dto.url,
                    sortOrder: (maxSort ?? -1) + 1,
                }),
            );

            await manager.update(Product, productId, { updatedBy: userId });
            return image;
        });
    }

    /**
     * remove image
     * @param productId
     * @param imageId
     * @param userId
     * @returns true/ false
     */
    async removeImage(productId: string, imageId: string, userId: string) {
        return await this.dataSource.transaction(async (manager) => {
            const product = await manager.exists(Product, {
                where: { id: productId },
                select: { id: true },
                lock: { mode: "pessimistic_write" },
            });
            if (!product) throw new NotFoundException("product not found");

            const image = await manager.findOne(ProductImage, {
                where: { id: imageId, productId },
                select: { id: true },
            });
            if (!image) throw new NotFoundException("Image not found");

            const count = await manager.count(ProductImage, {
                where: { productId },
            });
            if (count <= 1)
                throw new ConflictException(
                    "Product must have at least one image",
                );

            await manager.delete(ProductImage, { id: imageId, productId });
            await manager.update(Product, productId, { updatedBy: userId });

            return { deleted: true };
        });
    }
}
