import { IsInt, Max, Min, NotEquals } from "class-validator";

/** delta > 0: nhập thêm, delta < 0: xuất/hao hụt */
export class AdjustStockDto {
    @IsInt()
    @Min(-1_000_000)
    @Max(1_000_000)
    @NotEquals(0, { message: "delta không được bằng 0" })
    delta: number;
}
