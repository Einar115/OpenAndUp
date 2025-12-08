exports.up = async function(knex) {
  await knex.schema.createTable('test_cases', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('artifact_id');
    table.string('title').notNullable();
    table.text('description');
    table.enum('status', ['draft', 'ready', 'executing', 'blocked', 'passed', 'failed']).defaultTo('ready');
    table.string('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('artifact_id').references('id').inTable('artifacts').onDelete('SET NULL');
  });

  await knex.schema.createTable('test_runs', (table) => {
    table.string('id').primary();
    table.string('test_case_id').notNullable();
    table.enum('outcome', ['pass', 'fail', 'blocked']).notNullable();
    table.string('executed_by');
    table.text('notes');
    table.timestamp('executed_at').defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('test_case_id').references('id').inTable('test_cases').onDelete('CASCADE');
  });

  await knex.schema.raw('CREATE INDEX idx_test_cases_project ON test_cases(project_id)');
  await knex.schema.raw('CREATE INDEX idx_test_cases_artifact ON test_cases(artifact_id)');
  await knex.schema.raw('CREATE INDEX idx_test_runs_test_case ON test_runs(test_case_id)');
};

exports.down = async function(knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_test_runs_test_case');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_test_cases_project');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_test_cases_artifact');
  await knex.schema.dropTableIfExists('test_runs');
  await knex.schema.dropTableIfExists('test_cases');
};
