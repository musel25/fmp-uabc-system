# Documentación FMP-UABC System - Plan de Documentación

## Resumen del Proyecto

Sistema web Next.js 15 para la Facultad de Medicina y Psicología (FMP) de la UABC que gestiona el registro de eventos y solicitudes de certificados con flujo de revisión administrativa.

## 1. Documentación Existente

### Archivos actuales:
- ✅ `CLAUDE.md` - Instrucciones para Claude Code (muy completo)
- ❌ `README.md` - No existe
- ❌ Documentación de componentes
- ❌ Guías de usuario
- ❌ Documentación de API

## 2. Plan de Documentación Propuesto

### 2.1 Documentación Técnica Principal

#### A. README.md (Prioridad Alta)
**Propósito:** Punto de entrada principal para desarrolladores
**Contenido:**
- Descripción del proyecto y objetivos
- Requisitos del sistema
- Instalación y configuración
- Comandos de desarrollo
- Estructura básica del proyecto
- Contribución y despliegue

#### B. docs/ARCHITECTURE.md (Prioridad Alta)
**Propósito:** Arquitectura técnica detallada
**Contenido:**
- Diagrama de arquitectura del sistema
- Flujo de datos y estados
- Patrones de diseño utilizados
- Decisiones arquitectónicas
- Integración con Supabase
- Sistema de autenticación mock vs real

#### C. docs/API.md (Prioridad Media)
**Propósito:** Documentación de endpoints y rutas API
**Contenido:**
- Lista de rutas API disponibles
- Esquemas de request/response
- Códigos de error
- Ejemplos de uso
- Autenticación requerida

### 2.2 Documentación de Componentes

#### A. docs/COMPONENTS.md (Prioridad Media)
**Propósito:** Catálogo de componentes reutilizables
**Contenido:**
- Componentes UI (shadcn/ui)
- Componentes de layout
- Componentes específicos de eventos
- Componentes administrativos
- Props y ejemplos de uso

#### B. Storybook/Documentación Visual (Prioridad Baja)
**Propósito:** Documentación interactiva de componentes
**Consideraciones:**
- Evaluar si justifica la complejidad adicional
- Alternativa: screenshots en markdown

### 2.3 Documentación de Usuario

#### A. docs/USER_GUIDE.md (Prioridad Alta)
**Propósito:** Manual de usuario para el sistema
**Contenido:**
- Guía de registro e inicio de sesión
- Creación y gestión de eventos
- Solicitud de certificados
- Flujo completo del usuario
- Capturas de pantalla paso a paso

#### B. docs/ADMIN_GUIDE.md (Prioridad Alta)
**Propósito:** Manual para administradores
**Contenido:**
- Panel de administración
- Revisión y aprobación de eventos
- Gestión de certificados
- Reportes y estadísticas
- Flujos administrativos

### 2.4 Documentación de Desarrollo

#### A. docs/DEVELOPMENT.md (Prioridad Media)
**Propósito:** Guías para nuevos desarrolladores
**Contenido:**
- Configuración del entorno de desarrollo
- Convenciones de código
- Patrones de formularios con Zod
- Manejo de estado y datos mock
- Guías de testing (cuando se implemente)
- Proceso de code review

#### B. docs/DEPLOYMENT.md (Prioridad Media)
**Propósito:** Guías de despliegue y configuración
**Contenido:**
- Despliegue en producción
- Variables de entorno
- Configuración de Supabase
- Configuración de dominio UABC
- Monitoreo y logs

#### C. docs/TROUBLESHOOTING.md (Prioridad Baja)
**Propósito:** Resolución de problemas comunes
**Contenido:**
- Problemas frecuentes de desarrollo
- Errores de configuración
- Issues de despliegue
- FAQ técnico

### 2.5 Documentación de Datos

#### A. docs/DATABASE.md (Prioridad Media)
**Propósito:** Esquema y modelo de datos
**Contenido:**
- Esquema de base de datos (basado en schema.sql)
- Relaciones entre tablas
- Tipos de datos personalizados
- Datos de ejemplo y seeders
- Migraciones

#### B. docs/TYPES.md (Prioridad Baja)
**Propósito:** Documentación de tipos TypeScript
**Contenido:**
- Interfaces principales (Event, User, etc.)
- Tipos de estado y flujos
- Enums y constantes
- Validación con Zod

## 3. Priorización de Implementación

### Fase 1 (Esencial - Semana 1)
1. **README.md** - Documentación principal
2. **docs/USER_GUIDE.md** - Manual de usuario
3. **docs/ADMIN_GUIDE.md** - Manual de administrador

### Fase 2 (Importante - Semana 2-3)
4. **docs/ARCHITECTURE.md** - Arquitectura técnica
5. **docs/DEVELOPMENT.md** - Guía para desarrolladores
6. **docs/DATABASE.md** - Documentación de datos

### Fase 3 (Deseable - Semana 4)
7. **docs/API.md** - Documentación de API
8. **docs/COMPONENTS.md** - Catálogo de componentes
9. **docs/DEPLOYMENT.md** - Guías de despliegue

### Fase 4 (Opcional - Futuro)
10. **docs/TROUBLESHOOTING.md** - Resolución de problemas
11. **docs/TYPES.md** - Documentación de tipos
12. Consideración de Storybook

## 4. Estructura de Carpetas Propuesta

```
/
├── README.md
├── CLAUDE.md (existente)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── COMPONENTS.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   ├── TROUBLESHOOTING.md
│   ├── TYPES.md
│   ├── USER_GUIDE.md
│   ├── ADMIN_GUIDE.md
│   └── assets/
│       ├── screenshots/
│       └── diagrams/
└── [resto del proyecto]
```

## 5. Herramientas y Estándares

### Formato de Documentación
- **Formato:** Markdown (.md)
- **Idioma:** Español para guías de usuario, Inglés para documentación técnica
- **Estilo:** Tono profesional pero accesible
- **Versionado:** Incluir fechas de actualización

### Capturas de Pantalla
- **Herramienta sugerida:** Screenshot de navegador en resolución estándar
- **Ubicación:** `docs/assets/screenshots/`
- **Nomenclatura:** `[seccion]_[descripcion].png`
- **Actualización:** Mantener actualizadas con cambios de UI

### Diagramas
- **Herramientas sugeridas:** draw.io, Mermaid (en markdown), o Excalidraw
- **Tipos necesarios:** Flujo de datos, arquitectura del sistema, flujo de usuario
- **Ubicación:** `docs/assets/diagrams/`

## 6. Responsabilidades y Mantenimiento

### Creación Inicial
- Desarrollador principal o equipo técnico
- Revisión por stakeholders para guías de usuario

### Mantenimiento Continuo
- Actualizar con cada release mayor
- Revisar screenshots con cambios de UI
- Validar links y referencias
- Actualizar guías con nuevas funcionalidades

### Proceso de Revisión
- Code review incluye revisión de documentación afectada
- Testing de guías de usuario con usuarios reales
- Feedback continuo del equipo administrativo

## 7. Métricas de Éxito

### Indicadores de Calidad
- Tiempo de onboarding de nuevos desarrolladores
- Reducción de preguntas repetitivas de usuarios
- Facilidad de despliegue y configuración
- Satisfacción del usuario final

### Mantenimiento
- Documentación actualizada en cada release
- Links funcionales (verificación mensual)
- Screenshots actualizadas (verificación trimestral)
- Feedback incorporado regularmente

---

*Este plan de documentación está diseñado para ser implementado de forma incremental, priorizando las necesidades más críticas del proyecto FMP-UABC System.*