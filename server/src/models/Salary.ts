import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Employee } from './Employee';

@Table({
    tableName: 'salaries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Salary extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id!: string;

    @ForeignKey(() => Employee)
    @Column({
        type: DataType.UUID,
        allowNull: false,
    })
    employee_id!: string;

    @BelongsTo(() => Employee)
    employee!: Employee;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    year!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    month!: number;

    @Column({
        type: DataType.DECIMAL(10, 3), // Precision for currency
        allowNull: false,
    })
    salaire!: number;

    @Column({
        type: DataType.DECIMAL(10, 3),
        allowNull: true,
        defaultValue: 0,
    })
    prime!: number;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
    })
    absence!: number;
}
