import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";

import { CreatePermissionDto } from "./dto/create-permission.dto";
import { QueryPermissionDto } from "./dto/query-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { PermissionService } from "./permission.service";

@Controller("permissions")
export class PermissionController {
    constructor(private readonly permissionService: PermissionService) {}

    @Post()
    create(@Body() dto: CreatePermissionDto) {
        return this.permissionService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryPermissionDto) {
        return this.permissionService.findAll(query);
    }

    @Get(":id")
    findOne(@Param("id", ParseUUIDPipe) id: string) {
        return this.permissionService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseUUIDPipe) id: string,
        @Body() dto: UpdatePermissionDto,
    ) {
        return this.permissionService.update(id, dto);
    }

    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.permissionService.remove(id);
    }
}
