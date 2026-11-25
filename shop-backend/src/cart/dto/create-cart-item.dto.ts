import { IsInt, IsUUID, Max, Min } from "class-validator";

import { MAX_QTY_PER_ITEM } from "../cart.service";

export class CreateCartItemDto {
    @IsUUID()
    variantId: string;

    @IsInt()
    @Min(1)
    @Max(MAX_QTY_PER_ITEM)
    quantity: number;
}
