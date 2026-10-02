
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../deorators/role.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflactor: Reflector) { }
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {

        const requiredRoles = this.reflactor.getAllAndMerge<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const user = context.switchToHttp().getRequest().user;

        const hasRequiredRole = requiredRoles.some((role) => user.role === role);

        return hasRequiredRole;
    }
}
