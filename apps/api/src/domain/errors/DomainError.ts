export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} nao encontrado(a): ${id}`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = 'Credenciais invalidas') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = 'Acesso nao autorizado') {
    super(message);
    this.name = 'AuthorizationError';
  }
}
