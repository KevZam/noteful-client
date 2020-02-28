require("dotenv").config();

module.exports = {
  migrationsDirectory: "migrations",
  driver: "pg",
  connectionString: "postgresql://dunder_mifflin:night3102@localhost/noteful_1"
};
