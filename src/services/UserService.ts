import { UserRepository } from '../repositories/UserRepository';
import { UserResponseDTO, UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { NotFoundError, ConflictError, UnauthorizedError, InternalServerError } from '../utils';

/**
 * Serviço de usuários
 */
export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  /**
   * Busca usuário por ID
   */
  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    return new UserResponseDTO(user);
  }

  /**
   * Busca todos os usuários
   */
  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => new UserResponseDTO(user));
  }

  /**
   * Busca usuários por papel
   */
  async getUsersByRole(role: string): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findByRole(role);
    return users.map(user => new UserResponseDTO(user));
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    // Verificar se novo email já está em uso
    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        throw new ConflictError('Email já está em uso', 'EMAIL_IN_USE');
      }
    }

    // Atualizar dados
    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase();

    const updatedUser = await this.userRepository.update(userId, user);
    
    if (!updatedUser) {
      throw new InternalServerError('Erro ao atualizar perfil', 'UPDATE_ERROR');
    }

    return new UserResponseDTO(updatedUser);
  }

  /**
   * Altera senha do usuário
   */
  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    // Verificar senha atual
    const isPasswordValid = await user.checkPassword(dto.currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Senha atual incorreta', 'INVALID_PASSWORD');
    }

    // Definir nova senha
    await user.setPassword(dto.newPassword);
    await this.userRepository.update(userId, user);
  }

  /**
   * Deleta usuário
   */
  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.userRepository.delete(userId);
    
    if (!deleted) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }
  }
}

