import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { SignupDto } from './dto/signup.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response.dto';
import { GetUsersDto } from './dto/getUsers.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      this.logger.log({ email }, 'Finding user by email');
      return this.userRepository.findOne({ where: { email } });
    } catch (error) {
      this.logger.error(error, 'Error finding user by email');
      throw error;
    }
  }

  async createNewUser(signupDto: SignupDto): Promise<User> {
    try {
      this.logger.log({ signupDto }, 'Creating new user');
      const user = this.userRepository.create(signupDto);
      await user.hashPassword(signupDto.password);
      return await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(error, 'Error creating new user');
      throw error;
    }
  }

  async getUsers(query: GetUsersDto): Promise<UserResponseDto[]> {
    try {
      this.logger.log({ query }, 'Getting users');
      const queryBuilder = this.userRepository.createQueryBuilder('user');
      if (query.role) {
        queryBuilder.where('user.role = :role', { role: query.role });
      }
      const users = await queryBuilder.getMany();
      return plainToInstance(UserResponseDto, users, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error(error, 'Error getting users');
      throw error;
    }
  }
}
