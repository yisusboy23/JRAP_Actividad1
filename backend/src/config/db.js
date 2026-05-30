/**
 * db.js — Conexión a SQL Server
 *
 * PATRÓN APLICADO: Singleton (Creacional)
 *
 * Intención: Garantizar que exista una única instancia
 * del pool de conexiones en toda la aplicación.
 *
 * Problema que resuelve: Sin este patrón, cada módulo que
 * importa la DB podría crear su propio pool, agotando las
 * conexiones disponibles del servidor SQL.
 *
 * Implementación: La clase DatabaseConnection guarda la
 * instancia en una variable estática. Si ya existe, la
 * retorna; si no, la crea por primera vez.
 */

const sql = require("mssql/msnodesqlv8");

const REQUERIDAS = ["DB_SERVER", "DB_NAME"];
const faltantes = REQUERIDAS.filter((v) => !process.env[v]);
if (faltantes.length > 0) {
  console.error(`❌ Variables de entorno faltantes: ${faltantes.join(", ")}`);
  process.exit(1);
}

const dbConfig = {
  connectionString: `Driver={ODBC Driver 17 for SQL Server};Server=${process.env.DB_SERVER};Database=${process.env.DB_NAME};Trusted_Connection=yes;`,
  driver: "msnodesqlv8",
  pool: {         
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// ─────────────────────────────────────────────
// SINGLETON: clase con instancia única estática
// ─────────────────────────────────────────────
class DatabaseConnection {
  // Variable estática que guarda la única instancia
  static #instancia = null;
  #pool = null;

  // Constructor privado: nadie puede hacer "new DatabaseConnection()"
  // directamente desde afuera
  constructor() {
    if (DatabaseConnection.#instancia) {
      return DatabaseConnection.#instancia;
    }
    DatabaseConnection.#instancia = this;
  }

  /**
   * Punto de acceso global a la instancia única.
   * @returns {DatabaseConnection}
   */
  static getInstance() {
    if (!DatabaseConnection.#instancia) {
      DatabaseConnection.#instancia = new DatabaseConnection();
    }
    return DatabaseConnection.#instancia;
  }

  /**
   * Retorna el pool de conexiones, creándolo si no existe.
   * @returns {Promise<sql.ConnectionPool>}
   */
  async getPool() {
    if (!this.#pool) {
      this.#pool = await sql.connect(dbConfig);
      console.log("✅ Conexión a SQL Server establecida (instancia Singleton)");
    }
    return this.#pool;
  }

  /**
   * Ejecuta una consulta parametrizada sobre el pool.
   * @param {string} queryText
   * @param {Object} params
   * @returns {Promise<sql.IResult>}
   */
  async query(queryText, params = {}) {
    const pool = await this.getPool();
    const request = pool.request();

    Object.entries(params).forEach(([name, { type, value }]) => {
      request.input(name, type, value);
    });

    return request.query(queryText);
  }

  /**
   * Cierra la conexión (útil para tests o apagado limpio).
   */
  async cerrar() {
    if (this.#pool) {
      await this.#pool.close();
      this.#pool = null;
      DatabaseConnection.#instancia = null;
      console.log("🔌 Conexión cerrada");
    }
  }
}

// ─────────────────────────────────────────────
// Exportamos la instancia única y sql para tipos
// ─────────────────────────────────────────────
const db = DatabaseConnection.getInstance();

module.exports = {
  query: (queryText, params) => db.query(queryText, params),
  getPool: () => db.getPool(),
  sql,
  // Exportamos la clase para tests y documentación
  DatabaseConnection,
};