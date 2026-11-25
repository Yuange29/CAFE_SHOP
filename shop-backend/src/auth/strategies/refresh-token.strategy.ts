import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    "jwt-refresh",
) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                (req: Request) => {
                    return req?.cookies?.["refresh_token"] as string;
                },
            ]),
            secretOrKey: configService.get<string>("REFRESH_TOKEN_SECRET"),
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: any) {
        const refreshToken = req.cookies?.["refresh_token"];
        if (!refreshToken) {
            throw new UnauthorizedException(
                "Refresh token not found in cookies",
            );
        }
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions,
            refreshToken,
        };
    }
}
