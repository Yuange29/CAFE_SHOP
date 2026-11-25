import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
    Strategy,
    "jwt-access",
) {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>("ACCESS_TOKEN_SECRET"),
        });
    }

    validate(payload: any): {
        userId: string;
        email: string;
        role: string;
        permissions: string[];
    } {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            permissions: payload.permissions ?? [],
        };
    }
}
