import { createParamDecorator, ExecutionContext } from "@nestjs/common";

/**
 * no param: {id, name,.....}
 * param: string --> only this param value
 */
export const GetUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);
