
exports.seed = (knex, Promise) => {
  return knex('invitations').del()
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'jen',
        invited: 'fkm',
        invicode: 'ABCD',
        expired: false
      })
    );
  })
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'validcaller',
        invited: 'validcalled',
        invicode: 'validcode',
        expired: false
      })
    );
  })
  .then(() => {
    return Promise.join(
      knex('invitations').insert({
        inviting: 'expiredinvitation',
        invited: 'expiredinvitation',
        invicode: 'expiredinvitation',
        expired: true
      })
    );
  });
};
