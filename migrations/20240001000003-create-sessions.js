'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Sessions', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      sportId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Sports', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      dateTime: { type: Sequelize.DATE, allowNull: false },
      venue: { type: Sequelize.STRING, allowNull: false },
      teamAPlayers: { type: Sequelize.TEXT, defaultValue: '[]' },
      teamBPlayers: { type: Sequelize.TEXT, defaultValue: '[]' },
      additionalPlayersNeeded: { type: Sequelize.INTEGER, defaultValue: 0 },
      isCancelled: { type: Sequelize.BOOLEAN, defaultValue: false },
      cancelReason: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('Sessions');
  },
};
