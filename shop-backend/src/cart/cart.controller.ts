import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from "@nestjs/common";

import { GetUser } from "../auth/decorators/get-user.decorator";
import { Permission } from "../auth/decorators/permission.decorator";
import { JwtAccessAuthGuard } from "../auth/guards/jwt-access.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { PermissionAction } from "../common/enums/permission.enum";
import { CartService } from "./cart.service";
import { CreateCartItemDto } from "./dto/create-cart-item.dto";
import { UpdateCartItemDto } from "./dto/update-cart-item.dto";

@Controller("cart")
@UseGuards(JwtAccessAuthGuard, PermissionsGuard)
@Permission(PermissionAction.CART)
export class CartController {
    constructor(private readonly cartService: CartService) {}

    @Get()
    async getCart(@GetUser("id") userId: string) {
        return await this.cartService.getCart(userId);
    }

    @Post()
    async createCart(
        @GetUser("id") userId: string,
        @Body() dto: CreateCartItemDto,
    ) {
        return await this.cartService.addCartItem(userId, dto);
    }

    @Patch()
    async updateItemQuantity(
        @GetUser("id") userId: string,
        @Param("id") id: string,
        @Body() dto: UpdateCartItemDto,
    ) {
        return await this.cartService.updateCartItemQuantity(userId, id, dto);
    }

    @Delete()
    async removeCartItem(
        @GetUser("id") userId: string,
        @Param("id") id: string,
    ) {
        return await this.cartService.removeCartItem(userId, id);
    }
}
