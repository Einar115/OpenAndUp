exports.up = async function(knex) {
  // 1. CREAR TABLA DE VERSIONES
  await knex.schema.createTable('versions', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('version').notNullable(); // ej: v1.0.0, v1.1.0
    table.text('description');
    table.text('changes'); // Notas de cambios
    table.date('release_date');
    table.enum('status', ['draft', 'released', 'archived']).defaultTo('draft');
    table.string('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Claves foráneas
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.unique(['project_id', 'version']);
  });

  // 2. CREAR TABLA DE DEFECTOS
  await knex.schema.createTable('defects', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('title').notNullable();
    table.text('description');
    table.enum('severity', ['low', 'medium', 'high', 'critical']).defaultTo('medium');
    table.enum('status', ['open', 'in-progress', 'resolved', 'closed', 'reopened']).defaultTo('open');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.string('reported_by');
    table.string('assigned_to');
    table.string('phase_id'); // Fase donde se encontró
    table.string('iteration_id'); // Iteración donde se encontró
    table.date('reported_date').notNullable();
    table.date('resolved_date');
    table.text('resolution_notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Claves foráneas
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('phase_id').references('id').inTable('phases').onDelete('SET NULL');
    table.foreign('iteration_id').references('id').inTable('iterations').onDelete('SET NULL');
  });

  // 3. CREAR ÍNDICES
  await knex.schema.raw('CREATE INDEX idx_versions_project ON versions(project_id)');
  await knex.schema.raw('CREATE INDEX idx_defects_project ON defects(project_id)');
  await knex.schema.raw('CREATE INDEX idx_defects_status ON defects(status)');
  await knex.schema.raw('CREATE INDEX idx_defects_severity ON defects(severity)');
};

exports.down = async function(knex) {
  // Eliminar índices
  await knex.schema.raw('DROP INDEX IF EXISTS idx_versions_project');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_defects_project');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_defects_status');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_defects_severity');
  
  // Eliminar tablas
  await knex.schema.dropTableIfExists('defects');
  await knex.schema.dropTableIfExists('versions');
};
