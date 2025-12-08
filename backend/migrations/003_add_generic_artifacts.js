exports.up = async function(knex) {
  // Crear tabla genérica de artefactos para todas las fases
  await knex.schema.createTable('artifacts', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('phase_id'); // Fase asociada (opcional)
    table.string('iteration_id'); // Iteración asociada (opcional)
    table.string('name').notNullable();
    table.text('description');
    table.enum('type', [
      'vision-document',
      'architecture',
      'use-case',
      'test-case',
      'requirements',
      'design-document',
      'deployment-plan',
      'user-manual',
      'other'
    ]).defaultTo('other');
    table.enum('status', ['pending', 'in-progress', 'review', 'approved', 'done']).defaultTo('pending');
    table.boolean('required').defaultTo(false);
    table.string('owner');
    table.string('reviewer');
    table.date('due_date');
    table.date('completed_date');
    table.text('notes');
    table.string('file_url'); // URL o ruta del archivo si aplica
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Claves foráneas
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('phase_id').references('id').inTable('phases').onDelete('SET NULL');
    table.foreign('iteration_id').references('id').inTable('iterations').onDelete('SET NULL');
  });

  // Índices
  await knex.schema.raw('CREATE INDEX idx_artifacts_project ON artifacts(project_id)');
  await knex.schema.raw('CREATE INDEX idx_artifacts_phase ON artifacts(phase_id)');
  await knex.schema.raw('CREATE INDEX idx_artifacts_status ON artifacts(status)');
};

exports.down = async function(knex) {
  await knex.schema.raw('DROP INDEX IF EXISTS idx_artifacts_project');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_artifacts_phase');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_artifacts_status');
  await knex.schema.dropTableIfExists('artifacts');
};
