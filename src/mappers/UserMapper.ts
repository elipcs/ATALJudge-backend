/**
 * User Data Mapper
 * 
 * Maps between User domain models and DTOs.
 * Handles conversion of User entities to data transfer objects for API responses.
 * 
 * @module mappers/UserMapper
 */
import { User } from '../models/User';
import { Student } from '../models/Student';
import { UserResponseDTO, UserRegisterDTO, UpdateProfileDTO } from '../dtos/UserDtos';
import { UserRole } from '../enums';

/**
 * User Mapper Class
 * 
 * Provides static methods for converting between User domain objects and DTOs.
 * 
 * @class UserMapper
 */
export class UserMapper {
  /**
   * Converts a User domain model to UserResponseDTO
   * 
   * Includes student-specific properties if the user is a Student.
   * 
   * @static
   * @param {User} user - The user domain model to convert
   * @returns {UserResponseDTO} The user data transfer object
   */
  static toDTO(user: User): UserResponseDTO {
    const dto: Partial<UserResponseDTO> = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    // Adds Student-specific properties
    if (user instanceof Student) {
      const student = user as Student;
      dto.studentRegistration = student.studentRegistration;
      
      if (student.class) {
        dto.classId = student.class.id;
        dto.className = student.class.name;
      }
    }

    return new UserResponseDTO(dto);
  }

  /**
   * Converts a list of User domain models to UserResponseDTO[]
   * 
   * @static
   * @param {User[]} users - Array of user domain models
   * @returns {UserResponseDTO[]} Array of user data transfer objects
   */
  static toDTOList(users: User[]): UserResponseDTO[] {
    return users.map(user => this.toDTO(user));
  }

  /**
   * Applies UserRegisterDTO data to User (Domain)
   * Does not create the instance, only applies the data
   */
  static applyCreateDTO(user: User, dto: UserRegisterDTO): void {
    user.name = dto.name;
    user.email = dto.email;
    user.role = dto.role || UserRole.STUDENT;
    
    // If it's a student and has studentRegistration
    if (user instanceof Student && dto.studentRegistration) {
      user.studentRegistration = dto.studentRegistration;
    }
  }

  /**
   * Aplica dados de UpdateProfileDTO ao User (Domain)
   */
  static applyUpdateDTO(user: User, dto: UpdateProfileDTO): void {
    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.email !== undefined) {
      user.email = dto.email;
    }

    // Applies Student-specific properties
    if (user instanceof Student && dto.studentRegistration !== undefined) {
      (user as Student).studentRegistration = dto.studentRegistration;
    }
  }

  /**
   * Creates a simplified DTO (only id, name, email)
   * Useful for responses that don't need all data
   */
  static toSimpleDTO(user: User): Pick<UserResponseDTO, 'id' | 'name' | 'email' | 'role'> {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }
}

