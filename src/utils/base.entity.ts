import {
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn
} from 'typeorm';

// -------------------------------------------------- \\

export default class BaseEntity {
	@PrimaryGeneratedColumn()
	id?: number;

	@CreateDateColumn()
	createdAt?: Date;

	@UpdateDateColumn()
	updatedAt?: Date;
}
