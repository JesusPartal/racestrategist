import { LoginRequest, LoginResponse, User } from '../models/types';
export declare function login(req: LoginRequest): LoginResponse | null;
export declare function getUserById(userId: string): Omit<User, 'passwordHash'> | null;
//# sourceMappingURL=auth.service.d.ts.map