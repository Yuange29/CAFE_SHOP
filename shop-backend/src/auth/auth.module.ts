import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";

import { User } from "../database/entities";
import { Permission } from "../role/entities/permission.entity";
import { RolePermission } from "../role/entities/role-permission.entity";
import { Role } from "../role/entities/role.entity";
import { UserModule } from "../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAccessAuthGuard } from "./guards/jwt-access.guard";
import { JwtRefreshAuthGuard } from "./guards/jwt-refresh.guard";
import { PermissionsGuard } from "./guards/permissions.guard";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";

@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: process.env.ACCESS_TOKEN_SECRET,
            signOptions: { expiresIn: "15m" },
        }),
        TypeOrmModule.forFeature([User, Role, Permission, RolePermission]),
        UserModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        AccessTokenStrategy,
        RefreshTokenStrategy,
        JwtAccessAuthGuard,
        JwtRefreshAuthGuard,
        PermissionsGuard,
    ],
    exports: [AuthService],
})
export class AuthModule {}
