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
import { Password, Email, Score, StudentRegistration } from '../domain/value-objects';

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

    return Password.isStrongEnough(password);
  }

  defaultMessage(_args: ValidationArguments): string {
    const reqs = Password.getRequirements();
    const requirements = [];
    if (reqs.requiresUppercase) requirements.push('1 uppercase letter');
    if (reqs.requiresLowercase) requirements.push('1 lowercase letter');
    if (reqs.requiresNumber) requirements.push('1 number');
    if (reqs.requiresSpecial) requirements.push('1 special character');
    
    return `Password must be between ${reqs.minLength} and ${reqs.maxLength} characters, including: ${requirements.join(', ')}`;
  }
}


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

// Validator for Email using Email VO
@ValidatorConstraint({ name: 'IsValidEmail', async: false })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  validate(email: string, _args: ValidationArguments): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return Email.isValid(email);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Email must have a valid format (max 255 chars, local part max 64, domain max 253)';
  }
}

export function IsValidEmail(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEmailConstraint,
    });
  };
}

// Validator for Score using Score VO
@ValidatorConstraint({ name: 'IsValidScore', async: false })
export class IsValidScoreConstraint implements ValidatorConstraintInterface {
  validate(score: number, _args: ValidationArguments): boolean {
    if (score === null || score === undefined || typeof score !== 'number') {
      return false;
    }
    return Score.isValid(score);
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Score must be between ${Score.getMinValue()} and ${Score.getMaxValue()}`;
  }
}

export function IsValidScore(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidScoreConstraint,
    });
  };
}

// Validator for StudentRegistration using StudentRegistration VO
@ValidatorConstraint({ name: 'IsValidStudentRegistration', async: false })
export class IsValidStudentRegistrationConstraint implements ValidatorConstraintInterface {
  validate(registration: string, _args: ValidationArguments): boolean {
    if (!registration || typeof registration !== 'string') {
      return false;
    }
    return StudentRegistration.isValid(registration);
  }

  defaultMessage(_args: ValidationArguments): string {
    const reqs = StudentRegistration.getRequirements();
    return `Registration must be between ${reqs.minLength} and ${reqs.maxLength} characters (${reqs.allowedCharacters})`;
  }
}

export function IsValidStudentRegistration(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidStudentRegistrationConstraint,
    });
  };
}
