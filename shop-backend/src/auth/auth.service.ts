import * as bcrypt from "bcrypt";
import { Response } from "express";
import { Repository } from "typeorm";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";

import { User } from "../database/entities";
import { Permission } from "../role/entities/permission.entity";
import { RolePermission } from "../role/entities/role-permission.entity";
import { LoginUserDto } from "../user/dto/login-user.dto";
import { RegisterUserDto } from "../user/dto/register-user.dto";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
        @InjectRepository(Permission)
        private readonly permissionRepository: Repository<Permission>,
    ) {}

    async register(dto: RegisterUserDto) {
        const user = await this.userService.createUser(dto);

        return {
            message: "User created successfully.",
            user: this.mapUser(user),
        };
    }

    async login(dto: LoginUserDto, res: Response) {
        const user = await this.userService.findByEmail(dto.email, true);

        const isValidPassword = await this.userService.validatePassword(
            dto.password,
            user.passwordHash,
        );

        if (!isValidPassword) {
            throw new UnauthorizedException("Invalid email or password.");
        }

        const { accessToken, refreshToken } = await this.signToken(user);
        const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

        await this.userService.setHashToken(user.id, refreshTokenHash);

        res.cookie("access_token", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return { user: this.mapUser(user), accessToken };
    }

    async refresh(
        userPayload: { userId: string; email?: string },
        refreshToken: string,
        res: Response,
    ) {
        const user = await this.userService.findById(userPayload.userId, true);
        if (!user || !user.hashToken) {
            throw new UnauthorizedException(
                "Refresh token is invalid or expired.",
            );
        }

        const isTokenValid = await bcrypt.compare(refreshToken, user.hashToken);

        if (!isTokenValid) {
            throw new UnauthorizedException(
                "Refresh token is invalid or expired.",
            );
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await this.signToken(user);
        const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

        await this.userService.setHashToken(user.id, newRefreshTokenHash);

        res.cookie("access_token", newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 15 * 60 * 1000,
        });

        res.cookie("refresh_token", newRefreshToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            user: this.mapUser(user),
            accessToken: newAccessToken,
        };
    }

    async logout(userId: string, res: Response) {
        await this.userService.clearHashToken(userId);

        res.clearCookie("access_token");
        res.clearCookie("refresh_token");

        return {
            message: "Logout successful.",
            data: null,
        };
    }

    private async buildJwtPayload(user: User) {
        const roleName = user.role?.roleCode ?? "CUSTOMER";
        const permissions = await this.getPermissionsByUserId(user.id);

        return {
            sub: user.id,
            email: user.email,
            role: roleName,
            permissions,
        };
    }

    private async signToken(user: User) {
        const jwtPayload = await this.buildJwtPayload(user);

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.sign(jwtPayload, {
                secret: this.configService.get<string>("ACCESS_TOKEN_SECRET"),
                expiresIn: this.configService.get(
                    "ACCESS_TOKEN_SECRET_EXPIRES_IN",
                ),
            }),
            this.jwtService.sign(jwtPayload, {
                secret: this.configService.get<string>("REFRESH_TOKEN_SECRET"),
                expiresIn: this.configService.get(
                    "REFRESH_TOKEN_SECRET_EXPIRES_IN",
                ),
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async getPermissionsByUserId(userId: string): Promise<string[]> {
        const user = await this.userService.findById(userId);

        if (!user?.roleId) {
            return [];
        }

        const rolePermissions = await this.rolePermissionRepository.find({
            where: { roleId: user.roleId },
            relations: ["permission"],
        });

        const permissionCodes = (rolePermissions ?? [])
            .map((item) => item.permission?.permissionCode)
            .filter(Boolean) as string[];

        return [...new Set(permissionCodes.map((code) => code.toUpperCase()))];
    }

    private mapUser(user: Partial<User>) {
        return {
            userId: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role?.roleCode ?? "CUSTOMER",
            accountStatus: user.accountStatus,
        };
    }
}
