const knex = require('knex');
const config = require('./knexfile');

// Usar entorno NODE_ENV o development por defecto
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Exportar db y knex para raw queries si es necesario
module.exports = db;