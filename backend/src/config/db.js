const sql = require("mssql/msnodesqlv8");

const dbConfig = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
  driver: "msnodesqlv8",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log("✅ Conexión a SQL Server establecida");
  }
  return pool;
}

async function query(queryText, params = {}) {
  const poolInstance = await getPool();
  const request = poolInstance.request();

  Object.entries(params).forEach(([name, { type, value }]) => {
    request.input(name, type, value);
  });

  return request.query(queryText);
}

module.exports = { query, sql, getPool };