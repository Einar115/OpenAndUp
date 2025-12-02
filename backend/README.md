# Ejecutar migraciones para crear la base de datos
npx knex migrate:latest

# (Opcional) Poblar con datos de ejemplo
npx knex seed:run

# Modo producción
npm start