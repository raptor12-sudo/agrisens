exports.up = async function(knex) {
  // Colonnes LoRa sur devices
  const cols = await knex.raw(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'devices'
  `);
  const existing = cols.rows.map(r => r.column_name);

  await knex.schema.table('devices', t => {
    if (!existing.includes('lora_rssi'))             t.float('lora_rssi').nullable();
    if (!existing.includes('lora_snr'))              t.float('lora_snr').nullable();
    if (!existing.includes('derniere_transmission')) t.timestamp('derniere_transmission').nullable();
    if (!existing.includes('protocole_capteur'))     t.string('protocole_capteur', 20).defaultTo('RS485').nullable();
    if (!existing.includes('parcelle_id'))           t.uuid('parcelle_id').references('id').inTable('parcelles').nullable();
    if (!existing.includes('profondeur_cm'))         t.float('profondeur_cm').nullable();
  });

  // Table transmissions LoRa
  const hasTransmissions = await knex.schema.hasTable('lora_transmissions');
  if (!hasTransmissions) {
    await knex.schema.createTable('lora_transmissions', t => {
      t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      t.string('device_uid', 100).notNullable();
      t.uuid('gateway_id').references('id').inTable('gateways').nullable();
      t.float('rssi').nullable();
      t.float('snr').nullable();
      t.float('frequence').nullable();
      t.integer('spreading_factor').nullable();
      t.integer('payload_size').nullable();
      t.jsonb('payload_raw').nullable();
      t.boolean('decoded').defaultTo(false);
      t.timestamp('received_at').defaultTo(knex.fn.now());
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('lora_transmissions');
};
