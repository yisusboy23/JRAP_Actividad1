Jesus Rafael Aviles Poita
# 🎓 LMS Gamification — Sistema de Gestión de Aprendizaje con Gamificación
> **Actividad:** Proyecto Integrador — Actividad 4  

## 📋 Descripción del Sistema

**LMS Gamification** es un sistema de gestión de aprendizaje (Learning Management System) que incorpora mecánicas de gamificación para motivar a los estudiantes. Los docentes pueden crear y administrar cursos y módulos, mientras que los estudiantes progresan completando contenidos y acumulando puntos e insignias.

### Funcionalidades principales

- **Gestión de cursos y módulos** — CRUD completo con niveles (Básico, Intermedio, Avanzado)
- **Autenticación de docentes** — Login con JWT + bcrypt, registro de cuentas
- **Gamificación** — Sistema de puntos, insignias y ranking de estudiantes
- **Panel de administración** — Interfaz React para docentes
- **Dashboard de estudiantes** — Progreso, puntos y completado de módulos
- **CI/CD** — Pipeline automático con GitHub Actions

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend** | Node.js + Express.js |
| **Base de datos** | Microsoft SQL Server (ODBC Driver 17) |
| **Frontend** | React 18 + TypeScript + Vite |
| **Autenticación** | JWT (`jsonwebtoken`) + bcrypt |
| **HTTP Client** | Axios |
| **Testing** | Jest + Supertest |
| **CI/CD** | GitHub Actions |

---

## 📁 Estructura del Proyecto

```
mi-formulario/
├── .github/
│   └── workflows/
│       └── ci.yml                  ← Pipeline CI/CD (GitHub Actions)
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js               ← Singleton: pool de conexiones SQL Server
│   │   ├── controllers/
│   │   │   ├── authController.js   ← Login, registro, set-password
│   │   │   ├── courseController.js ← CRUD de cursos y módulos
│   │   │   ├── docenteController.js← CRUD de docentes con auditoría
│   │   │   ├── gamificationController.js ← Puntos, insignias, ranking
│   │   │   └── moduloController.js ← Módulos con niveles
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js   ← Verificación JWT
│   │   ├── observers/
│   │   │   └── GamificationObserver.js ← Observer: PuntosObserver, InsigniasObserver, LogObserver
│   │   ├── repositories/
│   │   │   └── PointsRepository.js ← Repository: acceso a datos de puntos
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── courseRoutes.js
│   │   │   ├── docenteRoutes.js
│   │   │   ├── gamificationRoutes.js
│   │   │   ├── moduloRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── services/
│   │   │   ├── pointsService.js    ← Lógica de negocio de puntos
│   │   │   └── rankingService.js   ← Cálculo y etiquetas de ranking
│   │   ├── strategies/
│   │   │   └── PuntosStrategy.js   ← Strategy: 4 estrategias de puntos
│   │   ├── tests/
│   │   │   ├── strategy.test.js            ← Unitarias: Strategy pattern
│   │   │   ├── pointsRepository.test.js    ← Unitarias: Repository pattern
│   │   │   ├── pointsService.test.js       ← Unitarias: servicio de puntos
│   │   │   ├── rankingService.test.js      ← Unitarias: servicio de ranking
│   │   │   ├── courseController.test.js    ← Unitarias: controller de cursos
│   │   │   ├── gamification.integration.test.js ← Integración: endpoints HTTP
│   │   │   └── flujoEstudiante.acceptance.test.js ← Aceptación: historia de usuario
│   │   └── utils/
│   │       └── constants.js        ← Constantes: PUNTOS, INSIGNIA, MOTIVO_PUNTOS
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.tsx          ← Navegación con autenticación
    │   │   └── ProtectedRoute.tsx  ← Guard de rutas privadas
    │   ├── context/
    │   │   └── AuthContext.tsx     ← Context API: estado de autenticación
    │   ├── pages/
    │   │   ├── Login.tsx           ← Login + registro de docentes
    │   │   ├── Dashboard.tsx       ← Vista estudiante: cursos y módulos
    │   │   ├── Ranking.tsx         ← Tabla de posiciones
    │   │   ├── Badges.tsx          ← Insignias por estudiante
    │   │   └── AdminPanel.tsx      ← Panel de administración docente
    │   └── services/
    │       └── api.ts              ← Cliente HTTP (Axios)
    ├── index.html
    └── package.json
```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js v20+
- Microsoft SQL Server con ODBC Driver 17
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/<usuario>/mi-formulario.git
cd mi-formulario
```
### 2. Importar BD
Aprovisionamiento de la Base de Datos (Persistencia)
Para el despliegue del esquema y la carga de datos iniciales del sistema LMS Gamification, se ha provisto un artefacto de paquete de aplicación de capa de datos (DAC Package) que garantiza la integridad de las relaciones y tipos de datos definidos en el modelo
.
Especificaciones del Artefacto:
Archivo: LMS_Gamification.bacpac
Ubicación: \ImportarBD\
Contenido: Definiciones de objetos de base de datos (tablas, constraints, índices) y registros lógicos iniciales.
Procedimiento de Despliegue mediante SSMS 20:
Conexión a la Instancia: Inicie SQL Server Management Studio (SSMS) v20 y establezca conexión con la instancia local del motor de base de datos
.
Importación Lógica (BACPAC):
En el Object Explorer, realice un clic derecho sobre el nodo Databases.
Seleccione la tarea "Import Data-tier Application..." para iniciar el asistente de despliegue de paquetes DAC.
Configuración de Origen: En la sección Import Settings, seleccione la opción "Import from local disk" y navegue hasta la ruta del archivo LMS_Gamification.bacpac.
Configuración del Target (Base de Datos):
En el campo New database name, asigne el identificador LMS_Gamification. Es crítico mantener este nombre para que coincida con la variable de entorno DB_NAME configurada en el archivo .env del backend
### 3. Configurar variables de entorno

Crear el archivo `backend/.env`:

```env
PORT=3000
DB_SERVER=<tu-servidor>\<instancia>
DB_NAME=LMS_Gamification
DB_PORT=1433
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRES=8h
```

### 4. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 5. Instalar dependencias del Frontend

```bash
cd ../frontend
npm install
```

### 6. Ejecutar en desarrollo

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# Servidor en: http://localhost:3000

# Terminal 2 — Frontend
cd frontend
npm run dev
# App en: http://localhost:5173
```

---

## 🏃 Ejecución de Pruebas

```bash
cd backend

# Ejecutar todas las pruebas
npm test

# Con reporte de cobertura
npm test -- --coverage

# Solo pruebas unitarias
npm test -- --testPathPattern="pointsService|rankingService|strategy|pointsRepository|courseController"

# Solo pruebas de integración
npm test -- --testPathPattern="integration"

# Solo prueba de aceptación
npm test -- --testPathPattern="acceptance"
```

### Resultado esperado

```
Test Suites: 7 passed, 7 total
Tests:       60+ passed
Coverage:    ≥ 70%
```

---

## 🔌 API — Endpoints

### Autenticación

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| POST | `/api/auth/login` | Login de docente → retorna JWT | No |
| POST | `/api/auth/register` | Registro de docente | No |
| POST | `/api/auth/set-password` | Establecer contraseña | No |

### Cursos

| Método | Endpoint | Descripción | Protegido |
|--------|----------|-------------|-----------|
| GET | `/api/courses` | Listar todos los cursos | No |
| GET | `/api/courses/:id` | Obtener curso con módulos y progreso | No |
| POST | `/api/courses` | Crear curso | Sí (JWT) |
| PUT | `/api/courses/:id` | Actualizar curso | Sí (JWT) |
| DELETE | `/api/courses/:id` | Eliminar curso | Sí (JWT) |
| POST | `/api/courses/:id/modulos` | Agregar módulo al curso | Sí (JWT) |
| PUT | `/api/courses/:cursoId/modulos/:moduloId` | Actualizar módulo | Sí (JWT) |
| DELETE | `/api/courses/:cursoId/modulos/:moduloId` | Eliminar módulo | Sí (JWT) |
| DELETE | `/api/courses/:cursoId/desvincular/:moduloId` | Desvincular módulo | Sí (JWT) |
| GET | `/api/courses/:id/progreso/:usuarioId` | Verificar curso completo | No |

### Gamificación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/gamification/completar-modulo` | Completar módulo → puntos + insignias |
| GET | `/api/gamification/ranking` | Top 10 estudiantes |
| GET | `/api/gamification/mis-puntos/:usuarioId` | Puntos y posición del usuario |
| GET | `/api/gamification/insignias/:usuarioId` | Insignias obtenidas |

### Docentes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/docentes` | Listar docentes activos |
| GET | `/api/docentes/:id` | Obtener docente |
| POST | `/api/docentes` | Crear docente |
| PUT | `/api/docentes/:id` | Actualizar docente |
| DELETE | `/api/docentes/:id` | Soft delete (activo=0) |
| GET | `/api/docentes/audit/:docenteId` | Log de auditoría |

### Módulos y Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/modulos/niveles` | Listar niveles (Básico/Intermedio/Avanzado) |
| GET | `/api/modulos/todos` | Todos los módulos |
| GET | `/api/modulos/:cursoId` | Módulos de un curso |
| POST | `/api/modulos/:cursoId` | Crear módulo |
| PUT | `/api/modulos/:moduloId` | Actualizar módulo |
| GET | `/api/users/estudiantes` | Listar estudiantes |
| POST | `/api/users/estudiantes` | Crear estudiante |

---

## 🎨 Patrones de Diseño Implementados

### 1. 🔒 Singleton — `src/config/db.js`

**Intención:** Garantizar una única instancia del pool de conexiones SQL Server.

**Problema que resuelve:** Sin Singleton, cada módulo que importa la DB podría crear su propio pool, agotando las conexiones disponibles.

```javascript
class DatabaseConnection {
  static #instancia = null;

  static getInstance() {
    if (!DatabaseConnection.#instancia) {
      DatabaseConnection.#instancia = new DatabaseConnection();
    }
    return DatabaseConnection.#instancia;
  }
}
const db = DatabaseConnection.getInstance();
```

---

### 2. 👁️ Observer — `src/observers/GamificationObserver.js`

**Intención:** Definir dependencia uno-a-muchos: cuando ocurre un evento de gamificación, todos los observadores son notificados automáticamente.

**Problema que resuelve:** El controlador `completarModulo()` antes llamaba directamente a puntos → insignias → ranking. Con Observer, solo emite el evento y los suscriptores reaccionan independientemente.

**Observadores registrados:**
- `LogObserver` — registra el evento en consola
- `PuntosObserver` — asigna puntos usando una Strategy
- `InsigniasObserver` — verifica y otorga insignias

```javascript
const canalGamificacion = new EventoGamificacion();
canalGamificacion.suscribir(new LogObserver());
canalGamificacion.suscribir(new PuntosObserver());
canalGamificacion.suscribir(new InsigniasObserver());

// En el controlador: solo emite, no sabe qué pasa después
await canalGamificacion.emitir("modulo:completado", { usuarioId, moduloId });
```

---

### 3. ♟️ Strategy — `src/strategies/PuntosStrategy.js`

**Intención:** Definir familia de algoritmos (reglas de asignación de puntos), encapsular cada uno y hacerlos intercambiables.

**Problema que resuelve:** Antes había funciones sueltas en `pointsService.js`. Agregar un nuevo tipo de puntos requería modificar ese archivo. Con Strategy, se agrega una clase sin tocar las existentes (Principio Abierto/Cerrado).

**Estrategias implementadas:**

| Clase | Puntos | Condición |
|-------|--------|-----------|
| `ModuloCompletadoStrategy` | 10 pts | Sin restricción |
| `CursoCompletadoStrategy` | 50 pts | Sin restricción |
| `PrimerAccesoStrategy` | 5 pts | Solo una vez por día |
| `RachaSemanalStrategy` | 30 pts | Sin racha previa esta semana |

```javascript
const contexto = new ContextoPuntos(new ModuloCompletadoStrategy(), repositorio);
await contexto.ejecutar(usuarioId);
// El contexto no sabe cuántos puntos da ni con qué condición
```

---

### 4. 🗄️ Repository — `src/repositories/PointsRepository.js`

**Intención:** Separar la lógica de acceso a datos de la lógica de negocio. El repositorio actúa como colección en memoria desde el punto de vista del servicio.

**Problema que resuelve:** `pointsService.js` mezclaba lógica de negocio con SQL. Si cambia la base de datos, solo hay que modificar el repositorio.

```javascript
class PointsRepository {
  async guardar(usuarioId, cantidad, motivo) { /* INSERT SQL */ }
  async obtenerTotal(usuarioId) { /* SELECT SUM */ }
  async existeHoyPorMotivo(usuarioId, motivo) { /* SELECT con fecha */ }
  async obtenerHistorial(usuarioId) { /* SELECT ORDER BY fecha */ }
}
```

---

## 🔄 Refactorizaciones Aplicadas

### 1. Extract Method — `docenteController.js`

**Antes:** La validación del CI y la sanitización estaban repetidas en cada función (`crearDocente`, `actualizarDocente`).

**Después:** Se extrajeron funciones reutilizables `validarCI()` y `sanitizarTexto()`.

```javascript
// ANTES (duplicado en cada función):
if (!ci) { /* ... */ }
const num = parseInt(ci);
if (isNaN(num) || num < 1000000 || num > 9999999) { /* error */ }
const nombre = texto.trim().substring(0, 100);

// DESPUÉS (función extraída):
function validarCI(ci) { /* lógica única */ }
function sanitizarTexto(texto, maxLen) { return texto.trim().substring(0, maxLen); }
```

---

### 2. Replace Magic Number — `docenteController.js` y `courseController.js`

**Antes:** Números y límites hardcodeados directamente en el código.

**Después:** Constantes con nombre semántico.

```javascript
// ANTES:
texto.substring(0, 100)
if (num < 1000000 || num > 9999999) { ... }
Math.round((completados / totalModulos) * 100)

// DESPUÉS:
const MAX_NOMBRE   = 100;
const MAX_EMAIL    = 150;
const MAX_ESPECIAL = 150;
const PORCENTAJE_MAXIMO = 100;
```

---

### 3. Separación de Responsabilidades (Extract Class) — `pointsService.js` → `PointsRepository.js`

**Antes:** `pointsService.js` mezclaba lógica de negocio con acceso a datos SQL.

**Después:** El acceso a la base de datos se extrajo a `PointsRepository`, y el servicio solo orquesta la lógica de negocio.

```javascript
// ANTES (en pointsService.js, todo mezclado):
async function asignarPuntos(usuarioId, cantidad, motivo) {
  await query(`INSERT INTO puntos ...`); // SQL directo en el servicio
}

// DESPUÉS (separado en PointsRepository.js):
class PointsRepository {
  async guardar(usuarioId, cantidad, motivo) { /* SQL aquí */ }
  async obtenerTotal(usuarioId) { /* SQL aquí */ }
}
// El servicio/observer usa el repositorio, no SQL directo
const repositorio = new PointsRepository();
await repositorio.guardar(usuarioId, cantidad, motivo);
```

---

## ♻️ Reutilización de Componentes

### Backend — Módulo centralizado `db.js`

Todos los controladores y repositorios importan el mismo cliente de base de datos. El patrón Singleton garantiza que siempre sea la misma instancia:

```javascript
// Cualquier archivo usa exactamente esto:
const { query, sql } = require("../config/db");
```

### Backend — `constants.js`

Las constantes `PUNTOS`, `INSIGNIA`, `MOTIVO_PUNTOS` y `UMBRAL_INSIGNIA` son compartidas por `PointsRepository`, `PuntosStrategy`, `GamificationObserver` y `pointsService`. Cambiar el valor de un punto solo requiere editar un archivo.

### Backend — `authMiddleware.js`

El middleware `verificarToken` es reutilizado por todas las rutas protegidas sin duplicar lógica:

```javascript
router.post("/", verificarToken, crearCurso);
router.put("/:id", verificarToken, actualizarCurso);
router.delete("/:id", verificarToken, eliminarCurso);
```

### Frontend — `api.ts` (Axios instance)

El cliente HTTP centralizado con `baseURL` preconfigurada es reutilizado por todos los componentes. Funciones exportadas (`getRanking`, `getInsignias`, `completarModulo`) evitan duplicar las llamadas.

### Frontend — `AuthContext.tsx`

El hook `useAuth()` es consumido por `Navbar`, `Login`, `AdminPanel` y `ProtectedRoute` sin duplicar el estado de autenticación.

### Frontend — `ProtectedRoute.tsx`

Componente reutilizable que protege cualquier ruta con una sola línea:

```tsx
<Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
```

---

## 🧪 Pruebas de Calidad

### Estructura de pruebas

| Archivo | Tipo | Qué prueba |
|---------|------|------------|
| `strategy.test.js` | Unitaria | 4 estrategias de puntos + ContextoPuntos |
| `pointsRepository.test.js` | Unitaria | PointsRepository: guardar, total, historial |
| `pointsService.test.js` | Unitaria | Servicio de puntos y reglas de negocio |
| `rankingService.test.js` | Unitaria | Ranking con etiquetas de posición |
| `courseController.test.js` | Unitaria | CRUD completo de cursos y módulos |
| `gamification.integration.test.js` | Integración | Endpoints HTTP con mock de DB |
| `flujoEstudiante.acceptance.test.js` | Aceptación | Historia de usuario completa (5 escenas) |

### Historia de usuario — Prueba de Aceptación

> *"Como estudiante, quiero completar módulos para acumular puntos y ganar insignias que muestren mi progreso."*

Las 5 escenas cubren: completar primer módulo → consultar ranking → ver insignias → completar segundo módulo → verificar posición.

### Ejecutar con cobertura

```bash
cd backend
npm test -- --coverage --coverageDirectory=coverage
```

Cobertura objetivo: **≥ 70%** en líneas, funciones y ramas.

---

## 🚀 CI/CD — GitHub Actions

El archivo `.github/workflows/ci.yml` ejecuta automáticamente las pruebas en cada `push` o `pull_request` a las ramas `main` y `master`:

```yaml
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd backend && npm install
      - run: cd backend && npm test
```

---

## 🔐 Seguridad Implementada

- **Queries parametrizadas** — cero concatenación de strings en SQL (prevención de SQL Injection)
- **bcrypt** — contraseñas hasheadas con salt 12 antes de guardar
- **JWT** — tokens firmados para sesiones de docentes
- **Validación de inputs** — todos los campos validados y sanitizados antes de procesarse
- **Soft delete** — los docentes nunca se borran físicamente (`activo = 0`)
- **Audit log** — tabla `docentes_audit_log` registra cambios históricos

---

## 🗺️ Despliegue

El sistema requiere SQL Server, por lo que el despliegue en servicios como Vercel/Netlify aplica solo al frontend. El backend puede desplegarse en:

- **Railway** — con SQL Server o migrando a PostgreSQL
- **Azure App Service** — nativo para SQL Server
- **Docker** — contenedorizar backend + SQL Server

> URL de despliegue: _(completar si aplica)_

---

## 📚 Referencias

- Gang of Four — *Design Patterns: Elements of Reusable Object-Oriented Software*
- Fowler, M. — *Refactoring: Improving the Design of Existing Code*
- PMBOK Guide — Gestión de proyectos (Triángulo de Hierro)
- Jest Documentation — https://jestjs.io/docs/getting-started
- Supertest — https://github.com/ladjs/supertest
