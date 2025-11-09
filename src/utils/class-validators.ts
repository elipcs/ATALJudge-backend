import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, registerDecorator, ValidationOptions } from 'class-validator';
import { UserRole } from '../enums';

/**
 * Is Valid Class Id For Role Constraint
 * 
 * Custom validator constraint for class-validator that validates class ID
 * only when the user role is student.
 */
@ValidatorConstraint({ name: 'IsValidClassIdForRole', async: false })
export class IsValidClassIdForRoleConstraint implements ValidatorConstraintInterface {
  /**
   * Validate Class ID based on role
   * 
   * Only validates the class ID if the user role is student.
   * If role is not student, class ID is optional.
   * 
   * @param {string} classId - Class ID to validate
   * @param {ValidationArguments} args - Validation arguments containing role value
   * @returns {boolean} True if class ID is valid or not required
   */
  validate(classId: string | undefined, args: ValidationArguments): boolean {
    const object = args.object as any;
    const role = object.role;

    // Se não for estudante (for professor ou monitor), não precisa de classId
    if (role === UserRole.PROFESSOR || role === UserRole.ASSISTANT || role === undefined) {
      return true;
    }

    // Se for estudante, precisa de um classId válido
    return typeof classId === 'string' && classId.length > 0;
  }

  /**
   * Default Error Message
   * 
   * @returns {string} Human-readable error message
   */
  defaultMessage(): string {
    return `Class ID is required for student registration`;
  }
}

/**
 * Is Valid Class Id For Role Decorator
 * 
 * Registers the IsValidClassIdForRoleConstraint validator for a property.
 * Used as a decorator on DTO class ID fields.
 * 
 * @function IsValidClassIdForRole
 * @param {ValidationOptions} [validationOptions] - class-validator options
 * @returns {Function} Property decorator function
 */
export function IsValidClassIdForRole(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidClassIdForRoleConstraint,
    });
  };
}