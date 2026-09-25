'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface) => {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@1234', 12);
    await queryInterface.bulkInsert('Users', [
      {
        name: 'Administrator',
        email: (process.env.ADMIN_EMAIL || 'admin@sports.com').toLowerCase(),
        passwordHash: hash,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('Users', {
      email: (process.env.ADMIN_EMAIL || 'admin@sports.com').toLowerCase(),
    });
  },
};
