/**
 * @module services/UserService
 * @description User management service responsible for CRUD operations and profile management.
 * 
 * This service handles:
 * - User retrieval (by ID, role, all users)
 * - Profile updates (name, email, student registration)
 * - Password changes with validation
 * - User deletion
 * 
 * @example
 * const userService = container.resolve(UserService);
 * const user = await userService.getUserById(userId);
 * const updated = await userService.updateProfile(userId, { name: 'New Name' });
 */

import { injectable, inject } from 'tsyringe';
import { UserRepository, GradeRepository } from '../repositories';
import { UserResponseDTO, UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { NotFoundError, ConflictError, UnauthorizedError, InternalServerError } from '../utils';
import { UserRole } from '../enums';

/**
 * Service for managing user accounts and profiles.
 * 
 * @class UserService
 */
@injectable()
export class UserService {
  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(GradeRepository) private gradeRepository: GradeRepository
  ) {}

  /**
   * Retrieves a user by ID along with grades if student.
   * 
   * @async
   * @param {string} id - The user ID to retrieve
   * @returns {Promise<UserResponseDTO>} The user data with grades if applicable
   * @throws {NotFoundError} If user does not exist
   */
  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const userResponse = new UserResponseDTO(user);

    if (user.role === UserRole.STUDENT) {
      const grades = await this.gradeRepository.findByStudent(id);
      userResponse.grades = grades.map(grade => ({
        id: grade.id,
        questionListId: grade.questionListId,
        questionListTitle: grade.questionList?.title,
        score: grade.score,
        createdAt: grade.createdAt,
        updatedAt: grade.updatedAt
      }));
    }

    return userResponse;
  }

  /**
   * Retrieves all users.
   * 
   * @async
   * @returns {Promise<UserResponseDTO[]>} Array of all users
   */
  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => new UserResponseDTO(user));
  }

  /**
   * Retrieves users by role.
   * 
   * @async
   * @param {string} role - The role to filter by
   * @returns {Promise<UserResponseDTO[]>} Array of users with specified role
   */
  async getUsersByRole(role: string): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findByRole(role);
    return users.map(user => new UserResponseDTO(user));
  }

  /**
   * Updates user profile information.
   * 
   * @async
   * @param {string} userId - The user ID to update
   * @param {UpdateProfileDTO} dto - Update data (name, email, student registration)
   * @returns {Promise<UserResponseDTO>} Updated user data
   * @throws {NotFoundError} If user not found
   * @throws {ConflictError} If email already in use
   * @throws {InternalServerError} If update operation fails
   */
  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        throw new ConflictError('Email already in use', 'EMAIL_IN_USE');
      }
    }

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    
    if (dto.studentRegistration !== undefined && 'studentRegistration' in user) {
      (user as any).studentRegistration = dto.studentRegistration;
    }

    const updatedUser = await this.userRepository.save(user);
    
    if (!updatedUser) {
      throw new InternalServerError('Error updating profile', 'UPDATE_ERROR');
    }

    return new UserResponseDTO(updatedUser);
  }

  /**
   * Changes user password with current password validation.
   * 
   * @async
   * @param {string} userId - The user ID
   * @param {ChangePasswordDTO} dto - Current and new passwords
   * @returns {Promise<void>}
   * @throws {NotFoundError} If user not found
   * @throws {UnauthorizedError} If current password is incorrect
   */
  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await user.checkPassword(dto.currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    await user.setPassword(dto.newPassword);
    await this.userRepository.update(userId, user);
  }

  /**
   * Deletes a user account.
   * 
   * @async
   * @param {string} userId - The user ID to delete
   * @returns {Promise<void>}
   * @throws {NotFoundError} If user not found
   */
  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.userRepository.delete(userId);
    
    if (!deleted) {
      throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }
  }
}

