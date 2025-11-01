import { ChildEntity } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';

/**
 * Entidade Assistant - representa um assistente
 */
@ChildEntity(UserRole.ASSISTANT)
export class Assistant extends User {
  // Campos específicos de assistente podem ser adicionados aqui no futuro
  // Exemplo: supervisedBy (professor), permissions, etc.
}

