import { UserRepository } from '../repositories/UserRepository';
import { UserResponseDTO, UpdateProfileDTO, ChangePasswordDTO } from '../dtos';
import { NotFoundError, ConflictError, UnauthorizedError, InternalServerError } from '../utils';

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    return new UserResponseDTO(user);
  }

  async getAllUsers(): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findAll();
    return users.map(user => new UserResponseDTO(user));
  }

  async getUsersByRole(role: string): Promise<UserResponseDTO[]> {
    const users = await this.userRepository.findByRole(role);
    return users.map(user => new UserResponseDTO(user));
  }

  async updateProfile(userId: string, dto: UpdateProfileDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepository.emailExists(dto.email);
      if (emailExists) {
        throw new ConflictError('Email já está em uso', 'EMAIL_IN_USE');
      }
    }

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email.toLowerCase();

    const updatedUser = await this.userRepository.update(userId, user);
    
    if (!updatedUser) {
      throw new InternalServerError('Erro ao atualizar perfil', 'UPDATE_ERROR');
    }

    return new UserResponseDTO(updatedUser);
  }

  async changePassword(userId: string, dto: ChangePasswordDTO): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await user.checkPassword(dto.currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Senha atual incorreta', 'INVALID_PASSWORD');
    }

    await user.setPassword(dto.newPassword);
    await this.userRepository.update(userId, user);
  }

  async deleteUser(userId: string): Promise<void> {
    const deleted = await this.userRepository.delete(userId);
    
    if (!deleted) {
      throw new NotFoundError('Usuário não encontrado', 'USER_NOT_FOUND');
    }
  }
}

