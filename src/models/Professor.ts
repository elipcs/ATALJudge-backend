import { ChildEntity } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';

/**
 * Entidade Professor - representa um professor
 */
@ChildEntity(UserRole.PROFESSOR)
export class Professor extends User {
  // Campos específicos de professor podem ser adicionados aqui no futuro
  // Exemplo: department, specialization, etc.
}

