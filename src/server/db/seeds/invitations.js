
exports.seed = (knex, Promise) => {
  return knex('invitations').del()
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'jen',
        invited: 'fkm',
        invicode: 'ABCD',
        isexpired: false
      })
    );
  })
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'validcaller',
        invited: 'validcalled',
        invicode: 'validcode',
        isexpired: false
      })
    );
  })
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'expiredinvitation',
        invited: 'expiredinvitation',
        invicode: 'expiredinvitation',
        isexpired: true
      })
    );
  });
};
