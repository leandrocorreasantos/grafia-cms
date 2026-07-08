# CHANGELOG

## v0.1.0 - 2026-07-07

### Added
- Implementacao de autenticacao JWT com controle por cargos e suporte a Application Passwords na API.
- Inclusao do caso de uso de login em [apps/api/src/application/auth/LoginUseCase.ts](apps/api/src/application/auth/LoginUseCase.ts) e servico JWT em [apps/api/src/infrastructure/auth/JwtService.ts](apps/api/src/infrastructure/auth/JwtService.ts).
- Endpoints de autenticacao e gerenciamento de senhas de aplicacao em [apps/api/src/interfaces/routes/authRoutes.ts](apps/api/src/interfaces/routes/authRoutes.ts).

### Changed
- Protecao das rotas de autenticacao, usuarios e posts com limites distintos para cenarios publicos e autenticados.
- Ajustes de tipagem de mocks nos testes de login para compatibilidade com `@jest/globals`.
- Reorganizacao da configuracao de testes para reduzir duplicacao de `tsconfig`.

### Security
- Endurecimento da validacao de email em [apps/api/src/domain/user/User.ts](apps/api/src/domain/user/User.ts) com abordagem deterministica para reduzir risco de ReDoS.
- Aplicacao de rate limiting em `/api/auth/login`, `/api/auth/me`, `/api/auth/app-passwords` e rotas de users/posts.
- Inclusao de middleware dedicado de rate limiting em [apps/api/src/interfaces/middlewares/rateLimitMiddleware.ts](apps/api/src/interfaces/middlewares/rateLimitMiddleware.ts).
- Hardening adicional em configuracoes de CORS e scripts de inicializacao/seguranca.

### Tests
- Remocao de senhas hardcoded em testes de login e migracao para variaveis de ambiente de teste.
- Ampliacao da cobertura de testes unitarios e de integracao para fluxos de autenticacao (incluindo app passwords).

### Configuration
- Simplificacao da configuracao de testes com [apps/api/tsconfig.test.json](apps/api/tsconfig.test.json) estendendo [apps/api/tsconfig.json](apps/api/tsconfig.json).
- Remocao de arquivo redundante de `tsconfig` especifico para a pasta de testes.
- Definicao explicita das variaveis de ambiente de teste em [apps/api/.env.test.example](apps/api/.env.test.example).
