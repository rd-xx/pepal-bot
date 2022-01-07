import { AfterLoad, BeforeInsert, BeforeUpdate, Entity } from 'typeorm';
import { Column } from 'typeorm/decorator/columns/Column';
import BaseEntity from '../utils/base.entity';
import crypto from 'crypto-js';

// -------------------------------------------------- \\

@Entity({ name: 'users' })
export default class UserEntity extends BaseEntity {
	@Column('varchar', { unique: true, length: 20 })
	discordId?: string;

	@Column('text', { unique: true })
	ppCookie?: string;

	@Column('numeric', { nullable: true })
	currentGrades?: number | null;

	// --------------- \\

	@BeforeInsert()
	@BeforeUpdate()
	encryptCookie(): void {
		this.ppCookie = crypto.AES.encrypt(
			this.ppCookie as string,
			process.env.CRYPTO_KEY
		).toString();
	}

	@AfterLoad()
	decryptCookie(): void {
		this.ppCookie = crypto.AES.decrypt(
			this.ppCookie as string,
			process.env.CRYPTO_KEY
		).toString(crypto.enc.Utf8);

		if (this.currentGrades !== undefined)
			this.currentGrades = Number(this.currentGrades);
	}
}
