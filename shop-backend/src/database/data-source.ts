import "reflect-metadata";

import { DataSource } from "typeorm";

import { entities } from "./entities";

export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? "shop_app",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_DATABASE ?? "shop_db",
    entities,
    migrations: ["src/database/migrations/*.ts"],
    synchronize: true,
});
