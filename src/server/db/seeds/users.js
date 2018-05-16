
exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('users').del()
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('users').insert({username: 'fkm', password: '123', admin: true, email: 'fkm@email.com'}),
        knex('users').insert({username: 'ufuk', password: '1234', admin: false, email: 'ufuk@email.com'})
      ]);
    });
};
