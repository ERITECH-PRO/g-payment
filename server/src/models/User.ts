import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { UserRole } from './UserRole';

@Table({
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class User extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    email!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    password!: string; // Will store hashed password

    @HasMany(() => UserRole)
    roles!: UserRole[];
}
