import "reflect-metadata";

import cookieParser from "cookie-parser";
import { DataSource } from "typeorm";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    const dataSource = app.get(DataSource);

    app.setGlobalPrefix("api/v1");
    app.use(cookieParser());

    app.useGlobalInterceptors(new ResponseInterceptor());

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
