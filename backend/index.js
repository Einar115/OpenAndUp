const { app, resetStore } = require('./app');

const port = process.env.PORT || 3001;

if (require.main === module) {
  resetStore();
  app.listen(port, () => {
    console.log(`OpenAndUp API running on port ${port}`);
  });
}
