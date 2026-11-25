import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { databaseConfig } from "./database/database.config";
import { AuthModule } from "./auth/auth.module";
import { RoleModule } from "./role/role.module";
import { UserModule } from "./user/user.module";
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: databaseConfig,
        }),

        AuthModule,
        RoleModule,
        UserModule,
        CategoryModule,
        ProductModule,
        CartModule,
    ],
})
export class AppModule {}
