const db = require('../db');

// Configurar entorno de test
process.env.NODE_ENV = 'test';

// Setup: ejecutar migraciones antes de todos los tests
beforeAll(async () => {
  await db.migrate.latest();
});

// Cleanup: limpiar la base de datos después de cada test
afterEach(async () => {
  // Eliminar datos en orden correcto (debido a foreign keys)
  await db('defects').del();
  await db('versions').del();
  await db('artifacts').del();
  await db('role_assignments').del();
  await db('inception_artifacts').del();
  await db('iterations').del();
  await db('plans').del();
  await db('phases').del();
  await db('projects').del();
});

// Teardown: cerrar conexión después de todos los tests
afterAll(async () => {
  await db.destroy();
});
