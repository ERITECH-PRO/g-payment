import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'counters',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Counter extends Model {
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
    entity!: string;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    last_value!: number;
}
