/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary();
    table.uuid('project_id').notNullable();
    table.uuid('phase_id').nullable();
    table.uuid('iteration_id').nullable();
    table.uuid('artifact_id').nullable();
    
    table.string('title', 255).notNullable();
    table.text('description');
    
    // Workflow y estado
    table.enum('status', [
      'backlog',      // En espera
      'todo',         // Por hacer
      'in-progress',  // En progreso
      'review',       // En revisión
      'testing',      // En pruebas
      'done',         // Completado
      'blocked'       // Bloqueado
    ]).notNullable().defaultTo('backlog');
    
    // Prioridad y severidad
    table.enum('priority', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
    table.enum('task_type', ['feature', 'bug', 'improvement', 'documentation', 'technical-debt']).notNullable().defaultTo('feature');
    
    // Asignación
    table.string('assigned_to', 255).nullable();
    table.string('assigned_role', 100).nullable();
    
    // Estimación y seguimiento
    table.integer('estimated_hours').nullable();
    table.integer('actual_hours').nullable();
    table.integer('progress_percentage').notNullable().defaultTo(0);
    
    // Tags y categorización
    table.json('tags').nullable();
    
    // Fechas
    table.datetime('due_date').nullable();
    table.datetime('started_at').nullable();
    table.datetime('completed_at').nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    
    // Foreign keys
    table.foreign('project_id').references('projects.id').onDelete('CASCADE');
    table.foreign('phase_id').references('phases.id').onDelete('SET NULL');
    table.foreign('iteration_id').references('iterations.id').onDelete('SET NULL');
    table.foreign('artifact_id').references('artifacts.id').onDelete('SET NULL');
    
    // Índices para búsquedas comunes
    table.index(['project_id', 'status']);
    table.index(['project_id', 'assigned_to']);
    table.index(['phase_id']);
    table.index(['status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tasks');
};
