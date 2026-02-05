import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { Salary } from './Salary';

@Table({
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Employee extends Model {
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
    code!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    nom!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    prenom!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    cin!: string;

    @Column({
        type: DataType.ENUM('CDI', 'CDD', 'STAGE', 'FREELANCE', 'INTERIM', 'SIVP', 'VERBAL'),
        allowNull: false,
    })
    type_contrat!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    service!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    poste!: string;

    @Column({
        type: DataType.STRING, // Storing date as string to match frontend type, or could be DATE
        allowNull: false,
    })
    date_embauche!: string;

    @HasMany(() => Salary)
    salaries!: Salary[];
}
