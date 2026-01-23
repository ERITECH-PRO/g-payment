import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from './User';

@Table({
    tableName: 'user_roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at in migration, but standard practice usually has it. Migration says: created_at TIMESTAMP... (unique)
})
export class UserRole extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id!: string;

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    user_id!: string;

    @BelongsTo(() => User)
    user!: User;

    @Column({
        type: DataType.ENUM('admin'),
        allowNull: false,
    })
    role!: string;
}
