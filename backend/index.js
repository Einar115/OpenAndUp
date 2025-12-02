const { app } = require('./app');
const db = require('./db');

const port = process.env.PORT || 3001;

if (require.main === module) {
  // Verificar conexión a la base de datos
  db.raw('SELECT 1')
    .then(() => {
      console.log('✅ Conectado a SQLite correctamente');
      app.listen(port, () => {
        console.log(`🚀 OpenAndUp API running on port ${port}`);
        console.log(`📊 Base de datos: SQLite`);
        console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((error) => {
      console.error('❌ Error al conectar con la base de datos:', error.message);
      process.exit(1);
    });
}