exports.up = async function(knex) {
  await knex.schema.table('defects', (table) => {
    table.string('artifact_id');
    table.string('test_case_id');
    table.foreign('artifact_id').references('id').inTable('artifacts').onDelete('SET NULL');
    table.foreign('test_case_id').references('id').inTable('test_cases').onDelete('SET NULL');
  });

  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_defects_artifact ON defects(artifact_id)');
  await knex.schema.raw('CREATE INDEX IF NOT EXISTS idx_defects_test_case ON defects(test_case_id)');
};

exports.down = async function(knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_defects_test_case');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_defects_artifact');
  await knex.schema.table('defects', (table) => {
    table.dropForeign('artifact_id');
    table.dropForeign('test_case_id');
    table.dropColumn('artifact_id');
    table.dropColumn('test_case_id');
  });
};
