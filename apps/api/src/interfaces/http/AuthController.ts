import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../application/auth/LoginUseCase';

export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, appName } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email e senha sao obrigatorios' });
        return;
      }

      const result = await this.loginUseCase.execute({ email, password, appName });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna as informacoes do usuario autenticado com base no token JWT.
   */
  async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Nao autenticado' });
      return;
    }

    res.json({
      id: req.user.sub,
      email: req.user.email,
      role: req.user.role,
      type: req.user.type,
      appName: req.user.appName,
    });
  }
}
