
exports.up = (knex, Promise) => {
  return knex.schema.createTable('invitations', (table) => {
    table.increments();
    table.string('inviting').notNullable();
    table.string('invited').notNullable();
    table.string('invicode').unique().notNullable();
    table.string('refcode');
    table.integer('giftcoins').defaultTo(10);
    table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
    table.boolean('isexpired').notNullable().defaultTo(false);
    table.timestamp('expired_at');
  });
};

exports.down = (knex, Promise) => {
  return knex.schema.dropTable('invitations');
};
