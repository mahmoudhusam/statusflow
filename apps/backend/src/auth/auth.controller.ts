import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
import { AuthGuard } from './guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() authDto: AuthDto) {
    return this.authService.signup(authDto.email, authDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto.email, authDto.password);
  }
  @UseGuards(AuthGuard)
  @Get('me')
  getMe() {
    return { message: 'Access granted' };
  }
}
