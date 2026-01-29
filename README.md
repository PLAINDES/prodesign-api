
# ProDesign API

Servicio Backend escalable construido con **Node.js** bajo una arquitectura de software limpia.

### 🛠️ Tecnologías Principales

* **Node.js**: Entorno de ejecución v20.20.0.
* **Express.js**: Framework web.
* **TypeScript**: Desarrollo con tipado estricto.
* **Bcrypt**: Encriptación de seguridad.
* **Multer**: Gestión de carga de archivos.

### 🏛️ Arquitectura

* **Patrón MVC**: (Modelo-Vista-Controlador).
* **Dominio Funcional**: Organización de carpetas por módulos.
* **Desacoplamiento**: Controladores independientes de la lógica de negocio para mayor testabilidad.

### 🚀 Instalación y Uso

```bash
# Instalar dependencias (limpio)
npm ci

# Compilar proyecto (TypeScript a JS)
npm run build

# Ejecutar en producción
npm run prod

```

### 🐳 Docker

El servicio está optimizado para contenedores y expone el puerto **8000**:

```bash
docker build -t prodesign-api .
docker run -p 8000:8000 prodesign-api
```


```bash
src/
├── controllers/        → Controladores (lógica de negocio)
├── models/             → Modelos de datos
├── routes/             → Definición de rutas
├── services/           → Lógica de dominio reutilizable
├── utils/              → Funciones auxiliares
├── middlewares/        → Middlewares (auth, validaciones)
├── config/             → Configuración general
├── types
└── index.ts            → Punto de entrada del servidor
```
