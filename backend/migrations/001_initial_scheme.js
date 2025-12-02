exports.up = async function(knex) {
  // 1. CREAR TABLA DE PROYECTOS
  await knex.schema.createTable('projects', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.date('start_date');
    table.date('end_date');
    table.enum('status', ['draft', 'active', 'archived']).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 2. CREAR TABLA DE FASES
  await knex.schema.createTable('phases', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.enum('key', ['inception', 'elaboration', 'construction', 'transition']).notNullable();
    table.string('name').notNullable();
    table.integer('order').notNullable();
    table.enum('status', ['not-started', 'in-progress', 'complete']).defaultTo('not-started');
    table.date('start_date');
    table.date('end_date');
    
    // Claves foráneas y restricciones
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.unique(['project_id', 'key']);
    table.unique(['project_id', 'order']);
  });

  // 3. CREAR TABLA DE PLANES
  await knex.schema.createTable('plans', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable().unique();
    table.text('summary').notNullable();
    table.text('objectives');
    table.text('risks');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
  });

  // 4. CREAR TABLA DE ITERACIONES
  await knex.schema.createTable('iterations', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('phase_id').notNullable();
    table.string('name').notNullable();
    table.text('goal');
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['planned', 'active', 'complete']).defaultTo('planned');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Claves foráneas
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('phase_id').references('id').inTable('phases').onDelete('CASCADE');
  });

  // 5. CREAR TABLA DE ARTEFACTOS DE INCEPCIÓN
  await knex.schema.createTable('inception_artifacts', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('name').notNullable();
    table.text('description');
    table.enum('status', ['pending', 'in-progress', 'done']).defaultTo('pending');
    table.boolean('required').defaultTo(false);
    table.string('owner');
    table.string('phase_id');
    
    // Claves foráneas
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('phase_id').references('id').inTable('phases').onDelete('SET NULL');
  });

  // 6. CREAR TABLA DE ASIGNACIONES DE ROLES
  await knex.schema.createTable('role_assignments', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.string('user').notNullable();
    table.enum('role', ['Project Manager', 'Tech Lead', 'QA', 'Stakeholder', 'Coach', 'Developer']).notNullable();
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    
    // Claves foráneas y restricciones
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.unique(['project_id', 'user', 'role']);
  });

  // 7. CREAR ÍNDICES BÁSICOS
  await knex.schema.raw('CREATE INDEX idx_phases_project ON phases(project_id)');
  await knex.schema.raw('CREATE INDEX idx_iterations_phase ON iterations(phase_id)');
  await knex.schema.raw('CREATE INDEX idx_iterations_project ON iterations(project_id)');
};

exports.down = async function(knex) {
  // Eliminar índices
  await knex.schema.raw('DROP INDEX IF EXISTS idx_phases_project');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_iterations_phase');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_iterations_project');
  
  // Eliminar tablas en orden inverso
  await knex.schema.dropTableIfExists('role_assignments');
  await knex.schema.dropTableIfExists('inception_artifacts');
  await knex.schema.dropTableIfExists('iterations');
  await knex.schema.dropTableIfExists('plans');
  await knex.schema.dropTableIfExists('phases');
  await knex.schema.dropTableIfExists('projects');
};