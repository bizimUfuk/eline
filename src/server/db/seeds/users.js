const bcrypt = require('bcryptjs');

exports.seed = (knex, Promise) => {
  return knex('users').del()
  .then(() => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync('fkm', salt);
    return Promise.join(
      knex('users').insert({
        username: 'fkm',
        email: 'fkm@fkm.com',
        password: hash,
        referrer: 'jen'
      })
    );
  })
  .then(() => {
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync('ufuk', salt);
    return Promise.join(
      knex('users').insert({
        username: 'ufuk',
        email: 'ufuk@ufuk.com',
        password: hash,
        referrer: 'jen',
        admin: true
      })
    );
  });
};

