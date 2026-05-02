import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>(
        'roles',
        [
          context.getHandler(),
          context.getClass(),
        ],
      );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest();

    console.log('--- RolesGuard Debug ---');
    console.log('Required Roles:', requiredRoles);
    console.log('User from request:', user);
    console.log('User Role:', user?.role);

    if (!user || !user.role) {
      return false;
    }

    const hasRole = requiredRoles.includes(user.role);
    console.log('Has Required Role:', hasRole);
    return hasRole;
  }
}