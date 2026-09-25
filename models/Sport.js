'use strict';

module.exports = (sequelize, DataTypes) => {
  const Sport = sequelize.define(
    'Sport',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'Sports',
      timestamps: true,
    }
  );

  Sport.associate = (models) => {
    Sport.belongsTo(models.User, { foreignKey: 'createdById', as: 'creator' });
    Sport.hasMany(models.Session, { foreignKey: 'sportId', as: 'sessions' });
  };

  return Sport;
};
