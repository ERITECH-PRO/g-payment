import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
    tableName: 'companies',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
})
export class Company extends Model {
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        primaryKey: true,
    })
    id!: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    nom!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    adresse!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    ville!: string;

    @Column({
        type: DataType.STRING, // URL to logo
        allowNull: true,
    })
    logo_url!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    cnss_employeur!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    rib!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    matricule_fiscal!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    banque!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    ccb!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    capital!: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
    telephone!: string;
}
