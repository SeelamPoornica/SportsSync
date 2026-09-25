'use strict';

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define(
    'Session',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      creatorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      dateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      venue: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      teamAPlayers: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('teamAPlayers');
          try { return JSON.parse(raw || '[]'); } catch { return []; }
        },
        set(val) {
          this.setDataValue('teamAPlayers', JSON.stringify(val || []));
        },
      },
      teamBPlayers: {
        type: DataTypes.TEXT,
        defaultValue: '[]',
        get() {
          const raw = this.getDataValue('teamBPlayers');
          try { return JSON.parse(raw || '[]'); } catch { return []; }
        },
        set(val) {
          this.setDataValue('teamBPlayers', JSON.stringify(val || []));
        },
      },
      additionalPlayersNeeded: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: { min: 0 },
      },
      isCancelled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      cancelReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'Sessions',
      timestamps: true,
    }
  );

  Session.associate = (models) => {
    Session.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
    Session.belongsTo(models.User, { foreignKey: 'creatorId', as: 'creator' });
    Session.hasMany(models.SessionPlayer, { foreignKey: 'sessionId', as: 'sessionPlayers' });
    Session.belongsToMany(models.User, {
      through: models.SessionPlayer,
      foreignKey: 'sessionId',
      as: 'players',
    });
  };

  return Session;
};
