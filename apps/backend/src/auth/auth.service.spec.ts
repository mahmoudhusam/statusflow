// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

// Define a reusable type for a mocked repository.
type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

// Factory function to create a mock user repository.
const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

// Mock the bcrypt library.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: MockRepository<User>;
  let jwtService: jest.Mocked<JwtService>;

  // FIX: Corrected the mock factory for JwtService.
  // The original implementation had a complex and incorrect type assertion.
  // This is a simple factory function that returns the mock object, which is the correct pattern for `useFactory`.
  const mockJwtService = () => ({
    signAsync: jest.fn(),
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        // Use the corrected factory for JwtService.
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService) as jest.Mocked<JwtService>;
  });

  describe('signup', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const hashedPassword = 'hashedPassword';

    it('should create and return a new user if email is unique', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      // The `create` method in TypeORM typically returns a non-saved entity instance.
      const userToSave = { email: testEmail, password: hashedPassword };
      userRepository.create.mockReturnValue(userToSave);
      // The `save` method persists the entity and returns it, often with DB-generated fields like id and timestamps.
      userRepository.save.mockResolvedValue({
        id: 1,
        ...userToSave,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);

      const result = await service.signup(testEmail, testPassword);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(testPassword, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: testEmail,
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(userToSave);
      expect(result).toEqual(expect.objectContaining({ email: testEmail }));
    });

    it('should throw ConflictException if user already exists', async () => {
      userRepository.findOne.mockResolvedValue({ email: testEmail } as User);

      await expect(service.signup(testEmail, testPassword)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.signup(testEmail, testPassword)).rejects.toThrow(
        'User already exists',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const hashedPassword = 'hashedPassword';
    const mockUser = {
      id: 1,
      email: testEmail,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as User;
    const mockToken = 'mockJwtToken';

    it('should return a token if credentials are valid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(testEmail, testPassword);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(testPassword, hashedPassword);
      expect(jwtService['signAsync']).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toEqual({ token: mockToken });
    });

    it('should throw ConflictException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(testEmail, testPassword)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.login(testEmail, testPassword)).rejects.toThrow(
        'User not found',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService['signAsync']).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(testEmail, testPassword)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(testEmail, testPassword)).rejects.toThrow(
        'Invalid password',
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: testEmail },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(testPassword, hashedPassword);
      expect(jwtService['signAsync']).not.toHaveBeenCalled();
    });
  });
});
