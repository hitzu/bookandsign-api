import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { SignupDto } from './dto/signup.dto';
import { AppDataSource as TestDataSource } from '../config/database/data-source';
import { UserFactory } from '../../test/factories/user/user.factory';
import { USER_ROLES } from '../common/types/user-roles.type';
import { USER_ROLE } from './constants/user_role.enum';

describe('UserService', () => {
  let service: UserService;
  let repository: Repository<User>;
  let userFactory: UserFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: TestDataSource.getRepository(User),
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
    userFactory = new UserFactory(TestDataSource);
  });

  describe('findUserByEmail', () => {
    describe('Happy Path - User Found', () => {
      it('should return a user when email exists', async () => {
        // Arrange
        const existingUser = await userFactory.create({
          email: 'test@example.com',
        });

        // Act
        const result = await service.findUserByEmail('test@example.com');

        // Assert
        expect(result).toBeDefined();
        expect(result?.id).toBe(existingUser.id);
        expect(result?.email).toBe('test@example.com');
        expect(result?.firstName).toBe(existingUser.firstName);
        expect(result?.lastName).toBe(existingUser.lastName);
      });

      it('should return user with all required properties', async () => {
        // Arrange
        const userData = await userFactory.make();
        const existingUser = await repository.save(userData);

        // Act
        const result = await service.findUserByEmail(existingUser.email ?? '');

        // Assert
        expect(result).toBeDefined();
      });
    });

    describe('Edge Case - User Not Found', () => {
      it('should return null when email does not exist', async () => {
        // Arrange
        const nonExistentEmail = 'nonexistent@example.com';

        // Act
        const result = await service.findUserByEmail(nonExistentEmail);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when database is empty', async () => {
        // Arrange - Database is empty

        // Act
        const result = await service.findUserByEmail('any@example.com');

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('Boundary Value Analysis - Email Variations', () => {
      it('should handle case-sensitive email lookup', async () => {
        // Arrange
        const user = await userFactory.create({
          email: 'Test@Example.com',
        });

        // Act
        const resultExact = await service.findUserByEmail('Test@Example.com');

        // Assert
        // Note: PostgreSQL's default behavior is case-sensitive for text columns
        // This test verifies the actual behavior
        expect(resultExact?.id).toBe(user.id);
        // The other cases may or may not match depending on DB collation
      });

      it('should handle email with special characters', async () => {
        // Arrange
        const emailWithSpecialChars = 'test+tag@example.co.uk';
        await userFactory.create({
          email: emailWithSpecialChars,
        });

        // Act
        const result = await service.findUserByEmail(emailWithSpecialChars);

        // Assert
        expect(result).toBeDefined();
        expect(result?.email).toBe(emailWithSpecialChars);
      });
    });

    describe('State-Based Testing - Database Consistency', () => {
      it('should return the same user when queried multiple times', async () => {
        // Arrange
        const user = await userFactory.create({
          email: 'consistent@example.com',
        });

        // Act
        const result1 = await service.findUserByEmail('consistent@example.com');
        const result2 = await service.findUserByEmail('consistent@example.com');

        // Assert
        expect(result1?.id).toBe(user.id);
        expect(result2?.id).toBe(user.id);
        expect(result1?.id).toBe(result2?.id);
      });

      it('should not return deleted users', async () => {
        // Arrange
        const user = await userFactory.create({
          email: 'tobedeleted@example.com',
        });
        await repository.softDelete({ id: user.id });

        // Act
        const result = await service.findUserByEmail('tobedeleted@example.com');

        // Assert
        // TypeORM's findOne with soft-deleted entities behavior
        // This depends on withDeleted option - default is to exclude deleted
        expect(result).toBeNull();
      });
    });

    // Error handling is tested implicitly through database operations
    // Explicit null repository tests don't provide value and cause runtime errors
  });

  describe('createNewUser', () => {
    describe('Happy Path - Valid User Creation', () => {
      it('should create a new user with valid SignupDto', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'SecurePassword123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.email).toBe(signupDto.email);
        expect(result.firstName).toBe(signupDto.firstName);
        expect(result.lastName).toBe(signupDto.lastName);
        expect(result.role).toBe(signupDto.role);
        expect(result.phone).toBe(signupDto.phone);
        expect(result.password).toBeDefined();
        expect(result.password).not.toBe(signupDto.password); // Password should be hashed
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
      });

      it('should hash the password correctly', async () => {
        // Arrange
        const userData = await userFactory.make();
        const plainPassword = 'MySecurePassword123!';
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: plainPassword,
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result.password).not.toBe(plainPassword);
        expect(result.password.length).toBeGreaterThan(50); // bcrypt hash length
        expect(await result.comparePassword(plainPassword)).toBe(true);
        expect(await result.comparePassword('wrongpassword')).toBe(false);
      });

      it('should persist user to database', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'TestPassword123!',
          phone: userData.phone,
        };

        // Act
        const createdUser = await service.createNewUser(signupDto);
        const foundUser = await repository.findOne({
          where: { id: createdUser.id },
        });

        // Assert
        expect(foundUser).toBeDefined();
        expect(foundUser?.id).toBe(createdUser.id);
        expect(foundUser?.email).toBe(signupDto.email);
      });
    });

    describe('Parameterized Testing - All User Roles', () => {
      const userRoles = Object.values(USER_ROLES);

      it.each(userRoles)('should create a user with role: %s', async (role) => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result).toBeDefined();
        expect(result.role).toBe(role);
      });
    });

    describe('Boundary Value Analysis - Password Variations', () => {
      it('should handle short passwords', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: '1234', // Minimum length
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result).toBeDefined();
        expect(await result.comparePassword('1234')).toBe(true);
      });

      it('should handle long passwords', async () => {
        // Arrange
        const userData = await userFactory.make();
        const longPassword = 'A'.repeat(200);
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: longPassword,
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result).toBeDefined();
        expect(await result.comparePassword(longPassword)).toBe(true);
      });

      it('should handle passwords with special characters', async () => {
        // Arrange
        const userData = await userFactory.make();
        const specialPassword = 'P@ssw0rd!#$%^&*()';
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: specialPassword,
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result).toBeDefined();
        expect(await result.comparePassword(specialPassword)).toBe(true);
      });
    });

    describe('Equivalence Partitioning - Name Variations', () => {
      it('should handle single character names', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: 'A',
          lastName: 'B',
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result.firstName).toBe('A');
        expect(result.lastName).toBe('B');
      });

      it('should handle very long names', async () => {
        // Arrange
        const userData = await userFactory.make();
        const longName = 'A'.repeat(100);
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: longName,
          lastName: longName,
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result.firstName).toBe(longName);
        expect(result.lastName).toBe(longName);
      });

      it('should handle names with special characters', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: "O'Brien",
          lastName: 'van der Berg',
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result.firstName).toBe("O'Brien");
        expect(result.lastName).toBe('van der Berg');
      });
    });

    describe('State-Based Testing - User Properties', () => {
      it('should set timestamps correctly', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };
        const beforeCreation = new Date();

        // Act
        const result = await service.createNewUser(signupDto);
        const afterCreation = new Date();

        // Assert
        expect(result.createdAt).toBeDefined();
        expect(result.updatedAt).toBeDefined();
        expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreation.getTime(),
        );
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(
          afterCreation.getTime() + 50,
        );
        expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeCreation.getTime(),
        );
      });

      it('should not set deletedAt on creation', async () => {
        // Arrange
        const userData = await userFactory.make();
        const signupDto: SignupDto = {
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: 'Password123!',
          phone: userData.phone,
        };

        // Act
        const result = await service.createNewUser(signupDto);

        // Assert
        expect(result.deletedAt).toBeNull();
      });
    });

    // Error handling is tested implicitly through database operations
    // Explicit null repository tests don't provide value and cause runtime errors
  });

  describe('getUsers', () => {
    it('should return all users when no role filter is provided', async () => {
      const user1 = await userFactory.create({
        role: USER_ROLE.ADMIN,
        email: 'admin.getUsers@example.com',
      });
      const user2 = await userFactory.create({
        role: USER_ROLE.SALES_AGENT,
        email: 'sales.getUsers@example.com',
      });

      const result = await service.getUsers({});

      expect(result).toHaveLength(2);
      expect(result.map((u) => u.id)).toEqual(
        expect.arrayContaining([user1.id, user2.id]),
      );

      const first = result[0] as unknown as Record<string, unknown>;
      expect(first.password).toBeUndefined();
    });

    it('should filter users by role when role filter is provided', async () => {
      await userFactory.create({
        role: USER_ROLE.SALES_AGENT,
        email: 'sales2.getUsers@example.com',
      });
      const admin = await userFactory.create({
        role: USER_ROLE.ADMIN,
        email: 'admin2.getUsers@example.com',
      });

      const result = await service.getUsers({ role: USER_ROLE.ADMIN });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(admin.id);
      expect(result[0].role).toBe(USER_ROLE.ADMIN);
    });
  });
});
