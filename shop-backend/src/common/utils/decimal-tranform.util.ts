import { ValueTransformer } from "typeorm";

//**
// Postgres trả numeric về dạng string -> ép về number */
export const decimalTransformer: ValueTransformer = {
    to: (value?: number | null) => value,
    from: (value?: string | null) =>
        value === null || value === undefined ? value : parseFloat(value),
};
