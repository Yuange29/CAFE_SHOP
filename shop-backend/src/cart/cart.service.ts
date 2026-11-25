import { DataSource, EntityManager } from "typeorm";

import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";

import { ProductVariant } from "../product/enities/product-variant.entity";
import { ProductStatus } from "../product/enities/product.entity";
import { ProductService } from "../product/product.service";
import { CreateCartItemDto } from "./dto/create-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";
import { CartItem } from "./entities/cart-item.entity";
import { Cart } from "./entities/cart.entity";

export const MAX_DISTINCT_ITEMS = 20;
export const MAX_QTY_PER_ITEM = 50;

type LineStatus =
    | "available"
    | "insufficient_stock"
    | "out_of_stock"
    | "unavailable";

@Injectable()
export class CartService {
    constructor(private readonly dataSource: DataSource) {}

    async getCart(userId: string) {
        const manager = this.dataSource.manager;
        const cart = await manager.findOne(Cart, {
            where: { userId },
            select: { id: true },
        });
        if (!cart) return { cartId: null, items: [], subtotal: 0 };
        return this.buildCartView(manager, cart.id);
    }

    async addCartItem(userId: string, dto: CreateCartItemDto) {
        return this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            const variant = await this.findSellableVariant(
                manager,
                dto.variantId,
            );
            if (!variant)
                throw new NotFoundException("Product is not available");

            const existing = await manager.findOne(CartItem, {
                where: { cartId: cart.id, variantId: dto.variantId },
            });

            const newQty = (existing?.quantity ?? 0) + dto.quantity;
            this.assertQuantity(newQty, variant.stockQuantity);

            if (existing) {
                await manager.update(CartItem, existing.id, {
                    quantity: newQty,
                });
            } else {
                const lines = await manager.count(CartItem, {
                    where: { cartId: cart.id },
                });
                if (lines >= MAX_DISTINCT_ITEMS)
                    throw new ConflictException(
                        `Cart can hold at most ${MAX_DISTINCT_ITEMS} different items`,
                    );
                await manager.insert(CartItem, {
                    cartId: cart.id,
                    variantId: dto.variantId,
                    quantity: dto.quantity,
                });
            }

            return this.buildCartView(manager, cart.id);
        });
    }

    /**
     * add new item to cart
     * @param userId
     * @param dto {variantId, quantity}
     * @returns cart : {cart item[]}
     */
    async updateCartItemQuantity(
        userId: string,
        itemId: string,
        dto: UpdateCartItemDto,
    ) {
        return this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            // điều kiện cartId: chỉ thao tác được dòng trong giỏ của chính mình
            const item = await manager.findOne(CartItem, {
                where: { id: itemId, cartId: cart.id },
            });
            if (!item) throw new NotFoundException("Cart item not found");

            const variant = await this.findSellableVariant(
                manager,
                item.variantId,
            );
            if (!variant)
                throw new ConflictException(
                    "This product is no longer available, please remove it from the cart",
                );

            this.assertQuantity(dto.quantity, variant.stockQuantity);

            await manager.update(CartItem, item.id, { quantity: dto.quantity });
            return this.buildCartView(manager, cart.id);
        });
    }

    async removeCartItem(userId: string, itemId: string) {
        return this.dataSource.transaction(async (manager) => {
            const cart = await this.lockCart(manager, userId);

            const result = await manager.delete(CartItem, {
                id: itemId,
                cartId: cart.id, // chặn xóa dòng của giỏ người khác
            });
            if (!result.affected)
                throw new NotFoundException("Cart item not found");

            return this.buildCartView(manager, cart.id);
        });
    }

    private async lockCart(
        manager: EntityManager,
        userId: string,
    ): Promise<Cart> {
        await manager
            .createQueryBuilder()
            .insert()
            .into(Cart)
            .values({ userId })
            .orIgnore()
            .execute();

        return manager.findOneOrFail(Cart, {
            where: { userId },
            lock: { mode: "pessimistic_write" },
        });
    }

    private findSellableVariant(manager: EntityManager, variantId: string) {
        return manager.findOne(ProductVariant, {
            where: {
                id: variantId,
                isActive: true,
                product: { status: ProductStatus.ACTIVE },
            },
            select: { id: true, stockQuantity: true },
        });
    }

    /**
     * find and lock cart for update function if it exist
     * @param userId user who own cart
     * @returns Cart
     */
    private assertQuantity(quantity: number, stock: number) {
        if (quantity > MAX_QTY_PER_ITEM)
            throw new ConflictException(
                `Maximum quantity per item is ${MAX_QTY_PER_ITEM}`,
            );
        // kiểm tra mềm: không giữ hàng, checkout sẽ kiểm tra và trừ kho lại
        if (quantity > stock)
            throw new ConflictException(
                `Insufficient stock: only ${stock} left`,
            );
    }

    private async buildCartView(manager: EntityManager, cartId: string) {
        const items = await manager.find(CartItem, {
            where: { cartId },
            relations: { variant: { product: true } },
            order: { createDate: "ASC" },
        });

        const lines = items.map((item) => {
            const { variant } = item;
            const { product } = variant;

            const sellable =
                variant.isActive && product.status === ProductStatus.ACTIVE;
            const status: LineStatus = !sellable
                ? "unavailable"
                : variant.stockQuantity === 0
                  ? "out_of_stock"
                  : item.quantity > variant.stockQuantity
                    ? "insufficient_stock"
                    : "available";

            return {
                id: item.id,
                variantId: variant.id,
                productName: product.name,
                productSlug: product.slug,
                variantName: variant.name,
                sku: variant.sku,
                unitPrice: variant.price,
                quantity: item.quantity,
                lineTotal: variant.price * item.quantity,
                availableStock: variant.stockQuantity,
                status,
            };
        });

        // chỉ cộng các dòng đang mua được; checkout vẫn tính lại ở server
        const subtotal =
            Math.round(
                lines
                    .filter((l) => l.status === "available")
                    .reduce((sum, l) => sum + l.lineTotal, 0) * 100,
            ) / 100;

        return { cartId, items: lines, subtotal };
    }
}
