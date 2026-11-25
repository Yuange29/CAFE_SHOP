import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { entities } from "./entities";

export const databaseConfig = (
    config: ConfigService,
): TypeOrmModuleOptions => ({
    type: "postgres",
    host: config.get<string>("DB_HOST", "localhost"),
    port: Number(config.get<string>("DB_PORT", "5432")),
    username: config.get<string>("DB_USERNAME", "shop_app"),
    password: config.get<string>("DB_PASSWORD", ""),
    database: config.get<string>("DB_DATABASE", "shop_db"),
    entities,
    dropSchema: false,
    synchronize: true,
    logging: config.get<string>("DB_LOGGING", "false") === "true",
    migrations: ["dist/database/migrations/*.js"],
    migrationsTableName: "typeorm_migrations",
});
