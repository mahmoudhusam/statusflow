import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  // This guard will use the JWT strategy to protect routes
  // You can add additional logic here if needed
  constructor() {
    super();
  }
}
