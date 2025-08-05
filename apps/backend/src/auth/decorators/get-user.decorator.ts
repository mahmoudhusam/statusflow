import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../user/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    //switch the context to HTTP to access the request object
    const req: RequestWithUser = ctx.switchToHttp().getRequest();

    //The 'user' property on the request object is populated by Passport
    //in the JWT strategy validate() method
    const user: User = req.user;

    //if data is provided, return the specific property
    //otherwise return the entire user object
    return data ? user?.[data] : user;
  },
);
