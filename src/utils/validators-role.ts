import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
import { UserRole } from '../enums';
import { StudentRegistration } from '../domain/value-objects';

/**
 * Is Valid Student Registration For Role Constraint
 * 
 * Custom validator constraint for class-validator that validates student registration numbers
 * only when the user role is student.
 * Uses StudentRegistration value object to enforce registration format rules.
 */
@ValidatorConstraint({ name: 'IsValidStudentRegistrationForRole', async: false })
export class IsValidStudentRegistrationForRoleConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Student Registration based on role
   * 
   * Only validates the registration if the user role is student.
   * If role is not student, registration is optional.
   * 
   * @param {string} registration - Registration number to validate
   * @param {ValidationArguments} args - Validation arguments containing role value
   * @returns {boolean} True if registration format is valid or not required
   */
  validate(registration: string, args: ValidationArguments): boolean {
    const object = args.object as any;
    const role = object.role;

    // Se não for estudante (for professor ou monitor), não precisa de matrícula
    if (role === UserRole.PROFESSOR || role === UserRole.ASSISTANT || role === undefined) {
      return true;
    }

    // Se for estudante, precisa de matrícula válida
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
   * @returns {string} Human-readable error message
   */
  defaultMessage(): string {
    return `Student registration must be exactly 9 or 11 digits`;
  }
}

/**
 * Is Valid Student Registration For Role Decorator
 * 
 * Registers the IsValidStudentRegistrationForRoleConstraint validator for a property.
 * Used as a decorator on DTO student registration fields.
 * 
 * @function IsValidStudentRegistrationForRole
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 */
export function IsValidStudentRegistrationForRole(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidStudentRegistrationForRoleConstraint,
    });
  };
}