import { Request, Response } from "express";

import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
} from "@nestjs/common";

import { LoginUserDto } from "../user/dto/login-user.dto";
import { RegisterUserDto } from "../user/dto/register-user.dto";
import { AuthService } from "./auth.service";
import { GetUser } from "./decorators/get-user.decorator";
import { Permission } from "./decorators/permission.decorator";
import { JwtAccessAuthGuard } from "./guards/jwt-access.guard";
import { JwtRefreshAuthGuard } from "./guards/jwt-refresh.guard";
import { PermissionsGuard } from "./guards/permissions.guard";

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post("register")
    register(@Body() dto: RegisterUserDto) {
        return this.authService.register(dto);
    }

    @Post("login")
    async login(
        @Body() dto: LoginUserDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.login(dto, res);
    }

    @Get("me")
    @UseGuards(JwtAccessAuthGuard, PermissionsGuard)
    @Permission("MY")
    getMe(
        @GetUser()
        user: {
            userId: string;
            email: string;
            role: string;
            permissions: string[];
        },
    ) {
        return {
            message: "Authorized user data.",
            data: user,
        };
    }

    @Post("logout")
    @UseGuards(JwtAccessAuthGuard)
    async logout(
        @Req() req: Request & { user?: { userId: string } },
        @Res({ passthrough: true }) res: Response,
    ) {
        const userId = req.user?.userId;

        if (!userId) {
            return {
                message: "Unauthorized.",
                data: null,
            };
        }

        return this.authService.logout(userId, res);
    }

    @Post("refresh")
    @UseGuards(JwtRefreshAuthGuard)
    async refresh(
        @Req() req: Request & { user?: { userId: string; email?: string } },
        @Res({ passthrough: true }) res: Response,
    ) {
        const userPayload = req.user;

        if (!userPayload?.userId) {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        const refreshToken = req.cookies?.refresh_token;

        return this.authService.refresh(userPayload, refreshToken, res);
    }
}
