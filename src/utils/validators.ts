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

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }

  formatErrors(): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    
    const formatError = (error: ValidationError): void => {
      if (error.constraints) {
        formatted[error.property] = Object.values(error.constraints);
      }

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

export async function validateDto<T extends object>(
  dtoClass: new () => T,
  data: any
): Promise<T> {

  const dtoInstance = plainToInstance(dtoClass, data, {
    enableImplicitConversion: true,
    exposeDefaultValues: true
  });

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

@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string, _args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    if (password.length < 12) {
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      return false;
    }

    if (!/[a-z]/.test(password)) {
      return false;
    }

    if (!/[0-9]/.test(password)) {
      return false;
    }

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

