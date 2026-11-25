import { IsInt, Max, Min } from "class-validator";

import { MAX_QTY_PER_ITEM } from "../cart.service";

export class UpdateCartItemDto {
    @Min(1)
    @Max(MAX_QTY_PER_ITEM)
    quantity: number;
}
