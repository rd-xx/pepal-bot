import { Column } from 'typeorm/decorator/columns/Column';
import BaseEntity from '../utils/base.entity';
import { Entity } from 'typeorm';

// -------------------------------------------------- \\

@Entity({ name: 'users' })
export default class UserEntity extends BaseEntity {
	@Column('varchar', { unique: true, length: 20 })
	discordId?: string;

	// --------------- \\

	@Column('text', { unique: true })
	ppCookie?: string;
}
