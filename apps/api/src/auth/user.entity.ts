import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/roles';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: Role;
}
