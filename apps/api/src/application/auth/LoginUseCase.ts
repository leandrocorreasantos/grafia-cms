import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/user/IUserRepository';
import { User } from '../../domain/user/User';
import { AuthenticationError } from '../../domain/errors/DomainError';
import { JwtService } from '../../infrastructure/auth/JwtService';

export interface LoginInput {
  email: string;
  password: string;
  appName?: string;
}

export interface LoginOutput {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  type: 'user' | 'application';
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new AuthenticationError('Email ou senha invalidos');
    }

    // Modo Application Password
    if (input.appName) {
      return this.authenticateWithAppPassword(user, input.password, input.appName);
    }

    // Modo normal (senha do usuario)
    return this.authenticateWithUserPassword(user, input.password);
  }

  private async authenticateWithUserPassword(
    user: User,
    password: string,
  ): Promise<LoginOutput> {
    const valid = await bcrypt.compare(password, user.getPasswordHash());
    if (!valid) {
      throw new AuthenticationError('Email ou senha invalidos');
    }

    const token = this.jwtService.generateToken({
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
      type: 'user',
    });

    return {
      token,
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
      },
      type: 'user',
    };
  }

  private async authenticateWithAppPassword(
    user: User,
    password: string,
    appName: string,
  ): Promise<LoginOutput> {
    const repo = this.userRepository as any;
    const appPassword = await repo.findApplicationPassword(user.getId(), appName);

    if (!appPassword) {
      throw new AuthenticationError(
        `Nenhuma senha de aplicacao encontrada para "${appName}"`,
      );
    }

    const valid = await bcrypt.compare(password, appPassword.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Senha de aplicacao invalida');
    }

    await repo.updateApplicationPasswordLastUsed(appPassword.id);

    const token = this.jwtService.generateToken({
      sub: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
      type: 'application',
      appName,
    });

    return {
      token,
      user: {
        id: user.getId(),
        email: user.getEmail(),
        name: user.getName(),
        role: user.getRole(),
      },
      type: 'application',
    };
  }
}
