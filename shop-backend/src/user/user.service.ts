import * as bcrypt from "bcrypt";
import { Transform } from "class-transformer";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { Repository } from "typeorm";

import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { Role } from "../role/entities/role.entity";
import { RegisterUserDto } from "./dto/register-user.dto";
import { AccountStatus, User } from "./entities/user.entity";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
    ) {}

    private async getDefaultCustomerRole() {
        let role = await this.roleRepository.findOne({
            where: { roleCode: "CUSTOMER" },
        });

        if (!role) {
            role = this.roleRepository.create({
                roleCode: "CUSTOMER",
                roleName: "Customer",
                description: "Default customer role",
                isActive: true,
            });

            role = await this.roleRepository.save(role);
        }

        return role;
    }

    async findByEmail(email: string, includePassword = false): Promise<User> {
        const normalizedEmail = email.trim().toLowerCase();

        const query = this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .where("LOWER(user.email) = :email", { email: normalizedEmail });

        if (includePassword) {
            query.addSelect("user.passwordHash");
        }

        const user = await query.getOne();

        if (!user) {
            throw new UnauthorizedException("User not found.");
        }

        return user;
    }

    async findById(
        userId: string,
        withHashToken = false,
    ): Promise<User | null> {
        const query = this.userRepository
            .createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .where("user.id = :userId", { userId });

        if (withHashToken) {
            query.addSelect("user.hashToken");
        }

        return query.getOne();
    }

    async createUser(dto: RegisterUserDto): Promise<User> {
        const email = dto.email?.trim().toLowerCase();
        const password = dto.password;

        if (!email) {
            throw new ConflictException("Email is required.");
        }

        if (!password) {
            throw new ConflictException("Password is required.");
        }

        const existingUser = await this.userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException("Email already exists.");
        }

        const defaultRole = await this.getDefaultCustomerRole();
        const fullName =
            dto.fullName?.trim() || email.split("@")[0] || "Customer";
        const passwordHash = await bcrypt.hash(password, 10);

        const user = this.userRepository.create({
            email,
            fullName,
            passwordHash,
            roleId: defaultRole.id,
            accountStatus: AccountStatus.ACTIVE,
        });

        return this.userRepository.save(user);
    }

    async setHashToken(
        userId: string,
        hashToken: string | null,
    ): Promise<void> {
        await this.userRepository.update(userId, { hashToken });
    }

    async clearHashToken(userId: string): Promise<void> {
        await this.userRepository.update(userId, { hashToken: null });
    }

    async validatePassword(
        plainPassword: string,
        passwordHash: string,
    ): Promise<boolean> {
        return bcrypt.compare(plainPassword, passwordHash);
    }
}
