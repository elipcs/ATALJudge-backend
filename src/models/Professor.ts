import { ChildEntity } from 'typeorm';
import { User } from './User';
import { UserRole } from '../enums';

@ChildEntity(UserRole.PROFESSOR)
export class Professor extends User {

}

