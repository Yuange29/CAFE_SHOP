import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Role } from '../role/entities/role.entity';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role])],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
