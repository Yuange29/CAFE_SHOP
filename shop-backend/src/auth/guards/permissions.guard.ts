import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { PERMISSION_KEY } from "../decorators/permission.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions =
            this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? [];

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new UnauthorizedException("User not authenticated.");
        }

        const userPermissions = (user.permissions ?? []).map((permission: string) =>
            permission.toUpperCase(),
        );
        const userRole = String(user.role ?? "").toUpperCase();

        if (userRole === "ADMIN") {
            return true;
        }

        if (!requiredPermissions.length) {
            return false;
        }

        return requiredPermissions.some((permission) =>
            userPermissions.includes(permission.toUpperCase()),
        );
    }
}
