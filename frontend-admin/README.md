# ROST Frontend Admin (Panel de Administración)

Este es el frontend administrativo del proyecto ROST, construido con **React + TypeScript + Vite** y estilado con **Tailwind CSS**. Permite gestionar usuarios, productos, categorías, pedidos, formas de pago, ingredientes y más.

## 🚀 Cómo empezar

Seguí estos pasos para correr el panel administrativo de manera local.

> [!IMPORTANT]  
> Usar siempre **pnpm** como gestor de paquetes para este proyecto.

### 1. Requisitos previos
Asegurate de tener instalado:
- **Node.js** (versión 18 o superior recomendada)
- **pnpm** (instalalo globalmente con `npm install -g pnpm` si todavía no lo tenés)

### 2. Instalar dependencias
Desde la carpeta `frontend-admin`, ejecutá:
```bash
pnpm install
```

### 3. Ejecutar el servidor de desarrollo
Para levantar el entorno local:
```bash
pnpm dev
```

El servidor levantará en [http://localhost:5173](http://localhost:5173) (o el puerto que te indique la consola). 

---

## 🔌 Conexión con la API Backend
Este proyecto cuenta con un proxy en `vite.config.ts` que redirige de manera automática las peticiones con prefijo `/api` a `http://localhost:8000` (el puerto por defecto del backend). 

*Asegurate de tener el backend corriendo en el puerto 8000 para que las peticiones se resuelvan correctamente.*
