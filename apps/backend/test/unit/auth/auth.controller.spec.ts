import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '@/auth/auth.controller';
import { AuthService } from '@/auth/auth.service';
import { AuthDto } from '@/auth/dto';
import { User } from '@/user/user.entity';
import { JwtService } from '@nestjs/jwt';

// A simple mock for AuthService
const mockAuthService = {
  signup: jest.fn(),
  login: jest.fn(),
};

// A simple mock for JwtService, needed for the AuthGuard
const mockJwtService = {
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

      // Fixed: Use string UUID and include monitors array
      const expectedUser = {
        id: 'user-uuid-123',
        email: dto.email,
        // Note: password should be removed by the service
        createdAt: new Date(),
        updatedAt: new Date(),
        monitors: [], // Add empty monitors array
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
    it('should return the authenticated user', () => {
      // Fixed: Create a proper mock user and pass it as parameter
      const mockUser: User = {
        id: 'user-uuid-123',
        email: 'test@example.com',
        password: 'hashedPassword', // In reality, this would be excluded by the GetUser decorator
        createdAt: new Date(),
        updatedAt: new Date(),
        monitors: [],
      };

      // Call getMe with the mock user
      const result = controller.getMe(mockUser);

      // Should return the user object
      expect(result).toEqual(mockUser);
    });
  });
});
