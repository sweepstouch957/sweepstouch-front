# Cambios Implementados - Create Store Feature

## Resumen
Se ha implementado exitosamente la funcionalidad de "Create Store" con un formulario stepper de dos pasos, siguiendo las especificaciones del CM del proyecto.

## Archivos Creados

### 1. Componentes de Store
- **`src/components/admin/stores/CreateStoreStep1.tsx`**
  - Formulario del paso 1 con todos los campos requeridos
  - Validación de formulario
  - Dropzone para imagen de tienda
  - Dropzone para contrato (PDF o imagen)
  - DatePicker para fecha de inicio de contrato
  - Selects para Membresía y Sweepstake
  - Preparado para geocoding automático (requiere API key de Google Maps)

- **`src/components/admin/stores/CreateStoreStep2.tsx`**
  - Formulario del paso 2 con información adicional
  - Campos para categoría, website, descripción
  - Campos para redes sociales (Facebook, Instagram)
  - Campo de información adicional
  - Nota: Este componente puede ser reemplazado con el código de la rama step2

- **`src/components/admin/stores/CreateStoreStepper.tsx`**
  - Componente principal que integra ambos pasos
  - Stepper visual con indicadores de progreso
  - Navegación entre pasos
  - Manejo de estado entre pasos
  - Preparado para integración con API

### 2. Páginas
- **`src/app/admin/management/stores/create/page.tsx`**
  - Actualizada para usar el nuevo componente CreateStoreStepper

- **`src/app/admin/management/stores/create/step-2/page.tsx`**
  - Página independiente para step-2 (compatibilidad con rama step2)

### 3. Navegación
Se actualizaron los siguientes archivos de navegación:

**ARCHIVO PRINCIPAL (el que se usa en producción):**
- **`src/hooks/use-routes.tsx`** ✅ ACTUALIZADO
  - Agregado "Create Store" debajo de "Listing" en el menú de Stores

**Archivos de navegación genéricos (para referencia):**
- `src/router/nav-items-generic-admin-dashboard/vertical-shells.tsx`
- `src/router/nav-items-generic-admin-dashboard/collapsed-shells.tsx`
- `src/router/nav-items-generic-admin-dashboard/stacked-shells.tsx`

Cambios realizados:
- Agregado item "Create Store" en el submenú de Stores
- "Create Store" aparece debajo de "Listing"
- Ruta configurada: `/admin/management/stores/create`

### 4. Traducciones
- **`src/i18n/translations/es.ts`**
  - Agregadas traducciones para:
    - "Create Store": "Crear tienda"
    - "Circulars": "Circulares"
    - "Manage": "Gestionar"
    - "Subscribed Stores": "Tiendas Suscritas"
    - "Info Dashboard": "Panel de Información"
    - "Schedule": "Programar"

## Campos del Formulario - Paso 1

### Campos Principales
1. **Name** - Nombre de la tienda (requerido)
2. **Address** - Dirección completa (requerido, con autocompletado preparado)
3. **Zip Code** - Código postal (requerido)
4. **Email** - Email de contacto (requerido, validación de formato)
5. **Phone** - Teléfono de la tienda (requerido)
6. **Store Image** - Carga de imagen (drag & drop o selección)
7. **Contract Start Date** - Fecha de inicio de contrato (DatePicker, requerido)
8. **Upload Contract** - Subida de contrato PDF o imagen (drag & drop o selección)
9. **Membership** - Select con opciones:
   - Free
   - Basic
   - Elite
   - Premium
10. **Sweepstake** - Select para sorteo activo (requerido)
11. **Latitude y Longitude** - Calculados automáticamente (campos de solo lectura)

### Validaciones Implementadas
- Campos requeridos marcados con asterisco
- Validación de email con regex
- Mensajes de error específicos para cada campo
- Validación antes de permitir avanzar al siguiente paso

## Campos del Formulario - Paso 2

### Información Adicional
1. **Category** - Categoría de la tienda (Supermercado, Tienda de Conveniencia, Licorería, Otro)
2. **Website** - Sitio web de la tienda
3. **Description** - Descripción de la tienda (multiline)
4. **Facebook** - URL de Facebook
5. **Instagram** - URL de Instagram
6. **Additional Info** - Información adicional (multiline)

## Funcionalidades Implementadas

### Stepper Visual
- Indicadores de círculo con estado (activo, completado, pendiente)
- Conectores entre pasos
- Títulos de pasos claramente visibles
- Diseño responsive

### Navegación
- Botón "Siguiente" en paso 1
- Botones "Atrás" y "Crear Tienda" en paso 2
- Preservación de datos al navegar entre pasos

### Drag & Drop
- Zona de arrastre para imagen de tienda
- Zona de arrastre para contrato
- Vista previa de imagen cargada
- Nombre de archivo mostrado para contrato

### Integración con el Sistema
- Compatible con el tema del proyecto (dark/light mode)
- Usa componentes de Material-UI existentes
- Estilos consistentes con el resto de la aplicación
- Toast notifications para feedback al usuario

## Estructura de Navegación Final

```
MANAGEMENT
├── Users
│   └── Listing
├── Stores
│   ├── Listing
│   └── Create Store ← FORMULARIO STEPPER AQUÍ
├── Campaigns
│   └── Listing
├── Sweepstakes
│   ├── Listing
│   ├── Create Sweepstakes
│   └── Prizes
├── Promotors
│   ├── Personnel management
│   └── Shift management
├── Ads
└── Circulars
    ├── Subscribed Stores
    ├── Info Dashboard
    ├── Manage Circulars
    └── Edit/Schedule Circulars
```

## Pendientes de Integración

### 1. Google Maps Geocoding
Para habilitar el geocoding automático de direcciones, necesitas:
1. Obtener una API key de Google Maps
2. Actualizar la función `geocodeAddress` en `CreateStoreStep1.tsx`
3. Descomentar las líneas de actualización de latitud/longitud

Ejemplo de implementación:
```typescript
const geocodeAddress = async (address: string) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`
    );
    const data = await response.json();
    if (data.results && data.results[0]) {
      const location = data.results[0].geometry.location;
      setFormData(prev => ({
        ...prev,
        latitude: location.lat,
        longitude: location.lng
      }));
    }
  } catch (error) {
    console.error('Error geocoding address:', error);
  }
};
```

### 2. API de Backend
Actualizar la función `handleStep2Submit` en `CreateStoreStepper.tsx` para conectar con tu API:
```typescript
const response = await storeService.createStore(completeData);
```

### 3. Integración con rama step2
Si tu compañero tiene código adicional en la rama step2, puedes:
1. Reemplazar `src/components/admin/stores/CreateStoreStep2.tsx` con su implementación
2. Asegurarte de que mantenga las props `onBack`, `onSubmit` e `initialData`

### 4. Lista de Sweepstakes Dinámica
Actualizar el Select de Sweepstake en `CreateStoreStep1.tsx` para cargar los sorteos desde la API:
```typescript
const [sweepstakes, setSweepstakes] = useState([]);

useEffect(() => {
  // Cargar sweepstakes desde API
  const fetchSweepstakes = async () => {
    const data = await sweepstakesService.getActive();
    setSweepstakes(data);
  };
  fetchSweepstakes();
}, []);
```

## Archivos Modificados - Resumen

### Archivos Principales
1. ✅ `src/hooks/use-routes.tsx` - Agregado "Create Store" al menú
2. ✅ `src/components/admin/stores/CreateStoreStep1.tsx` - Nuevo componente
3. ✅ `src/components/admin/stores/CreateStoreStep2.tsx` - Nuevo componente
4. ✅ `src/components/admin/stores/CreateStoreStepper.tsx` - Nuevo componente
5. ✅ `src/app/admin/management/stores/create/page.tsx` - Actualizado
6. ✅ `src/i18n/translations/es.ts` - Traducciones agregadas

### Archivos de Navegación Genéricos (opcionales)
- `src/router/nav-items-generic-admin-dashboard/vertical-shells.tsx`
- `src/router/nav-items-generic-admin-dashboard/collapsed-shells.tsx`
- `src/router/nav-items-generic-admin-dashboard/stacked-shells.tsx`

## Notas Importantes

1. **Archivo de Navegación Activo**: El proyecto usa `src/hooks/use-routes.tsx` para el menú del sidebar, no los archivos en `src/router/nav-items-generic-admin-dashboard/`

2. **Dependencias**: Todas las dependencias necesarias ya están instaladas en el proyecto (Material-UI, react-dropzone, dayjs, etc.)

3. **Estilos**: Los componentes usan el tema del proyecto y son totalmente responsive

4. **Compatibilidad**: Los cambios son compatibles con todos los roles de usuario

5. **Rutas**: Las rutas ya están configuradas en `src/router/routes.ts`

6. **Traducciones**: Se agregaron las traducciones en español. Si necesitas otros idiomas, actualiza los archivos correspondientes en `src/i18n/translations/`

## Pruebas Recomendadas

1. Navegar a `/admin/management/stores/create`
2. Verificar que el stepper se muestra correctamente
3. Completar el paso 1 con todos los campos requeridos
4. Verificar validaciones de campos
5. Avanzar al paso 2
6. Regresar al paso 1 y verificar que los datos se preservan
7. Completar paso 2 y enviar el formulario
8. Verificar que aparece el mensaje de éxito
9. Verificar redirección al listado de tiendas

## Cómo Acceder al Formulario

1. Iniciar sesión en la aplicación
2. En el sidebar izquierdo, ir a **MANAGEMENT**
3. Hacer clic en **Stores** para expandir el menú
4. Hacer clic en **Create Store**
5. Se abrirá el formulario stepper de dos pasos

## Soporte

Si tienes preguntas o necesitas ajustes adicionales, por favor revisa este documento y los comentarios en el código.

