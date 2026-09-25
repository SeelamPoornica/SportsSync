'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        set(val) {
          this.setDataValue('email', val.toLowerCase());
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'player'),
        defaultValue: 'player',
      },
    },
    {
      tableName: 'Users',
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasMany(models.Sport, { foreignKey: 'createdById', as: 'sports' });
    User.hasMany(models.Session, { foreignKey: 'creatorId', as: 'createdSessions' });
    User.belongsToMany(models.Session, {
      through: models.SessionPlayer,
      foreignKey: 'userId',
      as: 'joinedSessions',
    });
  };

  return User;
};
