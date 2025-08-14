# Sistema de Gestión de Reservas – Frontend

Aplicación web desarrollada como parte de una prueba técnica para la gestión de reservas en un espacio de coworking. Permite a los usuarios visualizar espacios disponibles, consultar reservas con paginación, crear nuevas reservas, ver detalles de un espacio y eliminar reservas.

## Enfoque y Metodología

Previo al desarrollo, se llevó a cabo un proceso de análisis y planificación que incluyó:

- Investigación de diseño para definir la experiencia de usuario, los flujos de interacción y la composición de componentes.
- Formalización de la arquitectura del frontend, priorizando la escalabilidad, mantenibilidad y claridad en la organización del código.
- Evaluación de librerías existentes para la gestión de reservas y visualización de agendas.  
  Se optó por desarrollar un motor propio para el control de slots, horarios y estados de reservas, con el fin de demostrar la capacidad de construir una solución completa desde cero sin depender de implementaciones externas.

## Decisiones Técnicas

- Framework: React + TypeScript con Vite para un desarrollo moderno y eficiente.
- Interfaz de usuario: Tailwind CSS y shadcn/ui para la creación de componentes accesibles y adaptables.
- Gestión de datos: TanStack Query para sincronización con el backend y manejo de caché.
- Manejo de estados y eventos: Hooks y contexto cuando es necesario, evitando complejidad innecesaria.
- Técnica de "front positivo": La interfaz refleja de forma inmediata las acciones del usuario mientras se espera la confirmación del backend.
- Contenedores: Configuración opcional con Docker y docker-compose para facilitar la ejecución en entornos controlados.

## Potenciales Mejoras

Si bien la implementación cumple los requisitos planteados, existen diversas áreas de mejora:

- Separar más componentes de la página inicial para aumentar la reutilización y modularidad.
- Definir estilos fijos y consistentes en toda la aplicación.
- Incorporar pruebas unitarias y de integración.
- Mejorar la accesibilidad y la capacidad de internacionalización.
- Ampliar la lógica del motor de reservas para soportar reglas y restricciones más avanzadas.

## Estructura del Proyecto
```plaintext
.
└── CoworkingReservation/
    ├── components/
    │   └── ui/
    ├── core/                                # Lógica de dominio “pura” (sin dependencias de UI)/
    │   └── slots/
    │       └── generateDaySlotsForSpace.ts  # Motor de generación de slots por espacio/día
    ├── domain/
    │   └── types.ts                         # Tipos y modelos de dominio (TS)
    ├── lib/
    │   ├── agenda/
    │   │   └── isMine.ts                    # Utilidades de agenda (p. ej. pertenencia de reserva)
    │   ├── api/                             # Capa de acceso a datos/
    │   │   ├── client.ts
    │   │   ├── fakeDb.ts                    # Fuente de datos simulada (desarrollo)
    │   │   ├── services.ts                  # Servicios de alto nivel (Espacios/Reservas)
    │   │   └── types.ts                     # Tipos específicos de la API
    │   ├── query/
    │   │   ├── hooks.ts                     # Hooks de TanStack Query (queries/mutations)
    │   │   └── keys.ts                      # Claves de cache y helpers de query
    │   ├── state/
    │   │   └── misReservas.ts               # Estado local/derivado (p. ej. reservas propias)
    │   └── utils.ts                         # Utilidades generales
    ├── pages/
    │   └── AgendaDayViewDemo.tsx            # Página de demostración (vista diaria de agenda)
    ├── ui/
    │   └── tokens/
    │       └── stateStyles.ts               # “Design tokens” y estilos derivados por estado
    └── utils/
        └── time/
            ├── range.ts                     # Cálculos de rangos/intervalos de tiempo
            └── tz.ts                        # Utilidades de zona horaria y normalización
```

## Instalación y Ejecución
```bash
# Clonar el repositorio
git clone https://github.com/DavidGomez3/CoworkingReservation.git
cd CoworkingReservation

# Instalar dependencias
pnpm install

# Iniciar en desarrollo
pnpm run dev

# Compilar para producción
pnpm build

# Ejecutar con Docker (opcional)
docker compose up --build
