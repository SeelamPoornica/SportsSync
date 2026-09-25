'use strict';

module.exports = (sequelize, DataTypes) => {
  const SessionPlayer = sequelize.define(
    'SessionPlayer',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'SessionPlayers',
      timestamps: true,
    }
  );

  SessionPlayer.associate = (models) => {
    SessionPlayer.belongsTo(models.Session, { foreignKey: 'sessionId', as: 'session' });
    SessionPlayer.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return SessionPlayer;
};
