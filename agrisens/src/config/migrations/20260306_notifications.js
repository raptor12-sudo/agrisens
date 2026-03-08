exports.up = async function(knex) {
  await knex.schema.createTableIfNotExists('notification_preferences', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').unique();
    t.boolean('email').defaultTo(true);
    t.boolean('sms').defaultTo(false);
    t.boolean('whatsapp').defaultTo(false);
    t.boolean('push').defaultTo(false);
    t.timestamps(true, true);
  });

  const hasPhone = await knex.schema.hasColumn('users', 'telephone');
  if (!hasPhone) {
    await knex.schema.table('users', t => {
      t.string('telephone', 20).nullable();
      t.text('push_subscription').nullable();
    });
  }

  await knex.schema.createTableIfNotExists('notifications', t => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('type', 50).notNullable();
    t.string('severite', 20);
    t.text('message');
    t.uuid('alerte_id').nullable();
    t.uuid('device_id').nullable();
    t.uuid('ferme_id').nullable();
    t.string('statut', 20).defaultTo('envoyee');
    t.jsonb('context');
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('notification_preferences');
};
