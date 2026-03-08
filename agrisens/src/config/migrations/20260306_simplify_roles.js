exports.up = async function(knex) {
  // Ajouter 'user' à l'enum existant
  await knex.raw(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user'`);

  // Mettre à jour les rôles existants
  await knex('users').whereIn('role', ['fermier','technicien','observateur']).update({ role: 'user' });
};

exports.down = async function(knex) {
  // PostgreSQL ne supporte pas DROP VALUE sur un enum
  // On remet les users en fermier
  await knex('users').where({ role: 'user' }).update({ role: 'fermier' });
};
