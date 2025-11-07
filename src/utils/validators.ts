/**
 * Validators Module
 * 
 * Provides custom validation rules and decorators for DTO validation.
 * Includes validators for passwords, emails, scores, and student registrations
 * using class-validator and custom value objects.
 * 
 * @module utils/validators
 */

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

/**
 * Validation Exception Class
 * 
 * Custom exception thrown when DTO validation fails.
 * Formats validation errors in a structured object format for API responses.
 * 
 * @class ValidationException
 * @extends Error
 * @property {ValidationError[]} errors - Array of class-validator ValidationError objects
 * 
 * @example
 * try {
 *   throw new ValidationException(validationErrors);
 * } catch (error) {
 *   const formattedErrors = error.formatErrors();
 *   // Returns: { fieldName: ['error message'], ... }
 * }
 */
export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }

  /**
   * Format Validation Errors
   * 
   * Converts class-validator ValidationError objects into a flat object
   * mapping field names to arrays of error messages.
   * Recursively processes nested validation errors from child objects.
   * 
   * @returns {Record<string, string[]>} Formatted errors object
   * 
   * @example
   * const errors = exception.formatErrors();
   * // Returns: { email: ['invalid email'], password: ['too weak'] }
   */
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

/**
 * Validate DTO Function
 * 
 * Validates data against a DTO class schema using class-validator.
 * Transforms plain JavaScript objects to DTO instances with type conversion.
 * Throws ValidationException if validation fails.
 * 
 * @async
 * @template T - The DTO class type
 * @param {new () => T} dtoClass - The DTO class constructor
 * @param {any} data - Plain object data to validate and transform
 * @returns {Promise<T>} Validated and transformed DTO instance
 * @throws {ValidationException} If validation fails
 * 
 * @example
 * const userDTO = await validateDto(UserRegisterDTO, {
 *   email: 'user@example.com',
 *   password: 'SecurePass123!'
 * });
 */
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

/**
 * Is Strong Password Constraint
 * 
 * Custom validator constraint for class-validator that validates password strength.
 * Uses Password value object to enforce password requirements.
 * 
 * @class IsStrongPasswordConstraint
 * @implements ValidatorConstraintInterface
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsStrongPassword()
 *   password: string;
 * }
 */
@ValidatorConstraint({ name: 'IsStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Password Strength
   * 
   * Checks if the password meets minimum strength requirements.
   * 
   * @param {string} password - Password to validate
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {boolean} True if password is strong enough
   */
  validate(password: string, _args: ValidationArguments): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }

    return Password.isStrongEnough(password);
  }

  /**
   * Default Error Message
   * 
   * Generates error message describing password requirements.
   * 
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {string} Human-readable error message
   */
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

/**
 * Is Strong Password Decorator
 * 
 * Registers the IsStrongPasswordConstraint validator for a property.
 * Used as a decorator on DTO password fields.
 * 
 * @function IsStrongPassword
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsStrongPassword()
 *   password: string;
 * }
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

/**
 * Is Valid Email Constraint
 * 
 * Custom validator constraint for class-validator that validates email format.
 * Uses Email value object to enforce email validation rules.
 * 
 * @class IsValidEmailConstraint
 * @implements ValidatorConstraintInterface
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsValidEmail()
 *   email: string;
 * }
 */
@ValidatorConstraint({ name: 'IsValidEmail', async: false })
export class IsValidEmailConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Email Format
   * 
   * Checks if email has valid format according to Email value object rules.
   * 
   * @param {string} email - Email to validate
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {boolean} True if email format is valid
   */
  validate(email: string, _args: ValidationArguments): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return Email.isValid(email);
  }

  /**
   * Default Error Message
   * 
   * Generates error message for invalid email format.
   * 
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {string} Human-readable error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return 'Email must have a valid format (max 255 chars, local part max 64, domain max 253)';
  }
}

/**
 * Is Valid Email Decorator
 * 
 * Registers the IsValidEmailConstraint validator for a property.
 * Used as a decorator on DTO email fields.
 * 
 * @function IsValidEmail
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsValidEmail()
 *   email: string;
 * }
 */
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

/**
 * Is Valid Score Constraint
 * 
 * Custom validator constraint for class-validator that validates score values.
 * Uses Score value object to enforce score range validation rules.
 * 
 * @class IsValidScoreConstraint
 * @implements ValidatorConstraintInterface
 * 
 * @example
 * class GradeDTO {
 *   @IsValidScore()
 *   score: number;
 * }
 */
@ValidatorConstraint({ name: 'IsValidScore', async: false })
export class IsValidScoreConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Score Value
   * 
   * Checks if score is within valid range according to Score value object rules.
   * 
   * @param {number} score - Score to validate
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {boolean} True if score is valid
   */
  validate(score: number, _args: ValidationArguments): boolean {
    if (score === null || score === undefined || typeof score !== 'number') {
      return false;
    }
    return Score.isValid(score);
  }

  /**
   * Default Error Message
   * 
   * Generates error message with score range information.
   * 
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {string} Human-readable error message
   */
  defaultMessage(_args: ValidationArguments): string {
    return `Score must be between ${Score.getMinValue()} and ${Score.getMaxValue()}`;
  }
}

/**
 * Is Valid Score Decorator
 * 
 * Registers the IsValidScoreConstraint validator for a property.
 * Used as a decorator on DTO score fields.
 * 
 * @function IsValidScore
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 * 
 * @example
 * class GradeDTO {
 *   @IsValidScore()
 *   score: number;
 * }
 */
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

/**
 * Is Valid Student Registration Constraint
 * 
 * Custom validator constraint for class-validator that validates student registration numbers.
 * Uses StudentRegistration value object to enforce registration format rules.
 * 
 * @class IsValidStudentRegistrationConstraint
 * @implements ValidatorConstraintInterface
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsValidStudentRegistration()
 *   registration: string;
 * }
 */
@ValidatorConstraint({ name: 'IsValidStudentRegistration', async: false })
export class IsValidStudentRegistrationConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Student Registration
   * 
   * Checks if registration number has valid format according to StudentRegistration value object rules.
   * 
   * @param {string} registration - Registration number to validate
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {boolean} True if registration format is valid
   */
  validate(registration: string, _args: ValidationArguments): boolean {
    if (!registration || typeof registration !== 'string') {
      return false;
    }
    return StudentRegistration.isValid(registration);
  }

  /**
   * Default Error Message
   * 
   * Generates error message with registration format requirements.
   * 
   * @param {ValidationArguments} _args - Validation arguments (unused)
   * @returns {string} Human-readable error message
   */
  defaultMessage(_args: ValidationArguments): string {
    const reqs = StudentRegistration.getRequirements();
    return `Registration must be between ${reqs.minLength} and ${reqs.maxLength} characters (${reqs.allowedCharacters})`;
  }
}

/**
 * Is Valid Student Registration Decorator
 * 
 * Registers the IsValidStudentRegistrationConstraint validator for a property.
 * Used as a decorator on DTO student registration fields.
 * 
 * @function IsValidStudentRegistration
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 * 
 * @example
 * class UserRegisterDTO {
 *   @IsValidStudentRegistration()
 *   registration: string;
 * }
 */
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
