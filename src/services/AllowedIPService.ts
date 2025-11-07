/**
 * @module services/AllowedIPService
 * @description Service for managing allowed IP addresses for security.
 */

import { injectable, inject } from 'tsyringe';
import { AllowedIPRepository } from '../repositories/AllowedIPRepository';
import { AllowedIPDTO, CreateAllowedIPDTO, UpdateAllowedIPDTO } from '../dtos';
import { NotFoundError, ConflictError, InternalServerError } from '../utils';

/**
 * Service for allowed IP management.
 * @class AllowedIPService
 */
@injectable()
export class AllowedIPService {
  constructor(
    @inject(AllowedIPRepository) private allowedIPRepository: AllowedIPRepository
  ) {}

  async getAllowedIPs(): Promise<AllowedIPDTO[]> {
    const ips = await this.allowedIPRepository.findAll();
    return ips.map(ip => new AllowedIPDTO(ip));
  }

  async getIPById(id: string): Promise<AllowedIPDTO> {
    const ip = await this.allowedIPRepository.findById(id);
    
    if (!ip) {
      throw new NotFoundError('IP não encontrado', 'IP_NOT_FOUND');
    }

    return new AllowedIPDTO(ip);
  }

  async createAllowedIP(dto: CreateAllowedIPDTO): Promise<AllowedIPDTO> {
    
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(dto.ip)) {
      throw new ConflictError('Formato de IP inválido', 'INVALID_IP_FORMAT');
    }

    const existingIP = await this.allowedIPRepository.findByIP(dto.ip);
    if (existingIP) {
      throw new ConflictError('Este IP já está cadastrado', 'IP_ALREADY_EXISTS');
    }

    const ip = await this.allowedIPRepository.create({
      ip: dto.ip,
      description: dto.description,
      active: true
    });

    return new AllowedIPDTO(ip);
  }

  async updateAllowedIP(id: string, dto: UpdateAllowedIPDTO): Promise<AllowedIPDTO> {
    const ip = await this.allowedIPRepository.findById(id);
    
    if (!ip) {
      throw new NotFoundError('IP não encontrado', 'IP_NOT_FOUND');
    }

    if (dto.description) ip.description = dto.description;
    if (dto.active !== undefined) ip.active = dto.active;

    const updated = await this.allowedIPRepository.update(id, ip);
    
    if (!updated) {
      throw new InternalServerError('Erro ao atualizar IP', 'UPDATE_ERROR');
    }

    return new AllowedIPDTO(updated);
  }

  async toggleIPStatus(id: string): Promise<AllowedIPDTO> {
    const ip = await this.allowedIPRepository.toggleIPStatus(id);
    
    if (!ip) {
      throw new NotFoundError('IP não encontrado', 'IP_NOT_FOUND');
    }

    return new AllowedIPDTO(ip);
  }

  async deleteAllowedIP(id: string): Promise<void> {
    const deleted = await this.allowedIPRepository.delete(id);
    
    if (!deleted) {
      throw new NotFoundError('IP não encontrado', 'IP_NOT_FOUND');
    }
  }

  async isIPAllowed(ip: string): Promise<boolean> {
    return this.allowedIPRepository.isIPAllowed(ip);
  }
}
