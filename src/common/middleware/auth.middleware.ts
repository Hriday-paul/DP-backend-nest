
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private readonly jwtService: JwtService, private readonly userService: UserService) { }
    async use(req: Request, res: Response, next: NextFunction) {

        const accessToken = req.headers['authorization']?.split(' ')[1];
        if (!accessToken) {
            throw new UnauthorizedException('Access denied');
        }
        let decode;

        try {
            decode = this.jwtService.verify(
                accessToken,
                { secret: process.env.JWT_ACCESS_SECRET }
            );
        } catch (err) {
            throw new UnauthorizedException('Access denied');
        }
        const { role, userId } = decode;

        if (!userId) {
            throw new UnauthorizedException('Access denied');
        }

        const user = await this.userService.getUserDetails(userId);

        if (!user) {
            throw new UnauthorizedException('Account does not exist');
        }

        if (!user?.auth?.isVerified) {
            throw new UnauthorizedException('You are not verified');
        }

        if (user?.auth?.isDeleted) {
            throw new UnauthorizedException('Your account is deleted');
        }

        if (!user?.auth?.isActive) {
            throw new UnauthorizedException('Your account is blocked');
        }

        const req_user = {
            id: userId,
            role: role,
            email: user?.email,
        }

        req['user'] = req_user;

        next();
    }
}
