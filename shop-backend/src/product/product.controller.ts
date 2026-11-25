import {
    Body,
    Controller,
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
import { AdjustStockDto } from "./dto/adjust-variant.dto";
import { CreateProductImage } from "./dto/create-product-image.dto";
import { CreateProductVariant } from "./dto/create-product-variant.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateVariantDto } from "./dto/update-product-variant.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductService } from "./product.service";

@Controller("product")
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.CREATE_PRODUCT)
    @Post()
    async createProduct(
        @Body() dto: CreateProductDto,
        @GetUser("id") userId: string,
    ) {
        return await this.productService.createProduct(dto, userId);
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.UPDATE_PRODUCT)
    @Patch(":id")
    async updateProductDetails(
        @Param("id") id: string,
        @Body() dto: UpdateProductDto,
        @GetUser("id") userId: string,
    ) {
        return await this.productService.updateProductDetails(dto, id, userId);
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.UPDATE_VARIANT)
    @Patch("variant/:id")
    async updateVariant(
        @Param("id") id: string,
        @GetUser("id") userId: string,
        @Body() dto: UpdateVariantDto,
    ) {
        return await this.productService.updateVariantDetail(id, dto, userId);
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.ADJUST_STOCK)
    @Patch("variant/:id/stock")
    async adjustStock(
        @Param("id") variantId: string,
        @GetUser("id") userId: string,
        @Body() dto: AdjustStockDto,
    ) {
        return await this.productService.adjustVariantStock(
            variantId,
            userId,
            dto,
        );
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.ADD_VARIANT)
    @Patch(":id/variant")
    async addVariant(
        @Param("id") id: string,
        @GetUser("id") userId: string,
        @Body() dto: CreateProductVariant,
    ) {
        return await this.productService.addNewVariant(id, dto, userId);
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.ADJUST_IMAGE)
    @Patch(":id/image")
    async addImage(
        @Param("id") productId: string,
        @Body() dto: CreateProductImage,
        @GetUser("id") userId: string,
    ) {
        return await this.productService.addNewImage(productId, dto, userId);
    }

    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission(PermissionAction.ADJUST_IMAGE)
    @Patch(":id/image/:imageId")
    async removeImage(
        @Param("id") productId: string,
        @Param("imageId") imageId: string,
        @GetUser("id") userId: string,
    ) {
        return await this.productService.removeImage(
            productId,
            imageId,
            userId,
        );
    }
}
