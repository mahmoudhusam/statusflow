// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt'; // Import JwtService

// A simple mock for AuthService
const mockAuthService = {
  signup: jest.fn(),
  login: jest.fn(),
};

// A simple mock for JwtService, needed for the AuthGuard
const mockJwtService = {
  // Add any methods your AuthGuard might use, even if they are empty mocks
  verifyAsync: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        // FIX: Provide a mock for JwtService.
        // The AuthGuard used by the controller depends on JwtService.
        // Without this, Nest's dependency injector doesn't know how to create the guard.
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(
      AuthService,
    ) as jest.Mocked<AuthService>;
  });

  // Clear mocks after each test to ensure a clean state.
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should call AuthService.signup with correct parameters', async () => {
      const dto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedUser = {
        id: 1,
        email: dto.email,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      authService.signup.mockResolvedValue(expectedUser);

      const result = await controller.signup(dto);

      expect(authService.signup).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('login', () => {
    it('should call AuthService.login with correct parameters and return a token', async () => {
      const dto: AuthDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const expectedToken = { token: 'mockJwtToken' };
      authService.login.mockResolvedValue(expectedToken);

      const result = await controller.login(dto);

      expect(authService.login).toHaveBeenCalledWith(dto.email, dto.password);
      expect(result).toEqual(expectedToken);
    });
  });

  describe('getMe', () => {
    it('should return "Access granted" message', () => {
      // Note: This test will pass because we provided a mock JwtService,
      // allowing the AuthGuard to be instantiated. If you wanted to test
      // the guard's logic itself, you would need a more complex setup.
      const result = controller.getMe();
      expect(result).toEqual({ message: 'Access granted' });
    });
  });
});
