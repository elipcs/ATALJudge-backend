import { 
  validate, 
  ValidationError, 
  ValidatorConstraint, 
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions
} from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Erro de validação personalizado
 */
export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }

  /**
   * Formata os erros de validação
   */
  formatErrors(): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    
    const formatError = (error: ValidationError): void => {
      if (error.constraints) {
        formatted[error.property] = Object.values(error.constraints);
      }
      
      // Processar erros de propriedades aninhadas
      if (error.children && error.children.length > 0) {
        for (const child of error.children) {
          formatError(child);
        }
      }
    };
    
    for (const error of this.errors) {
      formatError(error);
    }
    
    return formatted;
  }
}

/**
 * Valida um DTO usando class-validator
 */
export async function validateDto<T extends object>(
  dtoClass: new () => T,
  data: any
): Promise<T> {
  // Converte o objeto plain para instância da classe
  // enableImplicitConversion permite converter strings para outros tipos automaticamente
  const dtoInstance = plainToInstance(dtoClass, data, {
    enableImplicitConversion: true,
    exposeDefaultValues: true
  });
  
  // Valida
  const errors = await validate(dtoInstance as object, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false
  });
  
  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
  
  return dtoInstance;
}

/**
 * Validador de senha forte customizado
 * Requisitos:
 * - Mínimo 12 caracteres
 * - Pelo menos 1 letra maiúscula
 * - Pelo menos 1 letra minúscula
 * - Pelo menos 1 número
 * - Pelo menos 1 caractere especial
 */
@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, _args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Mínimo 12 caracteres
    if (password.length < 12) {
      return false;
    }

    // Pelo menos 1 letra maiúscula
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // Pelo menos 1 letra minúscula
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // Pelo menos 1 número
    if (!/[0-9]/.test(password)) {
      return false;
    }

    // Pelo menos 1 caractere especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Senha deve ter pelo menos 12 caracteres, incluindo: 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial (!@#$%^&*()_+-=[]{};\':"\\|,.<>/?)';
  }
}

/**
 * Decorator para validação de senha forte
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

