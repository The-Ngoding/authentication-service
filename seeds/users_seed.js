const faker = require('faker');
const bcrypt = require('bcrypt');
require('dotenv').config();
exports.seed = function(knex) {
  // Deletes ALL existing entries
  return knex('users').del()
      .then(async function() {
      // Generate an array of 100 user objects
        const users = [];
        for (let i = 0; i < 100; i++) {
          const password = await bcrypt.hash(`password`, 10);
          users.push({
            uuid: faker.datatype.uuid(),
            name: faker.name.findName(),
            email: faker.internet.email(),
            password: password,
            username: faker.internet.userName(),
          });
        }
        users.push(
            {
              uuid: faker.datatype.uuid(),
              name: faker.name.findName(),
              email: 'test@example.com',
              password: await bcrypt.hash(`password`, 10),
              username: 'test',
            },
        );
        // Insert the user data into the 'users' table
        await knex('users').insert(users);
      });
};
