import { map } from "rxjs/operators";

import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>) {
        return next.handle().pipe(
            map((data) => {
                return {
                    success: true,
                    statusCode: context.switchToHttp().getResponse().statusCode,
                    data,
                };
            }),
        );
    }
}
