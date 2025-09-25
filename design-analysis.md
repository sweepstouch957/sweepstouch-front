# Análisis de Diseño - sweepsTOUCH Dashboard

## Estructura General

### Layout Principal
- **Sidebar izquierda fija**: Fondo oscuro (#2D3748 aprox), ancho ~250px
- **Header superior**: Fondo claro, altura ~60px
- **Contenido principal**: Fondo gris claro (#F7FAFC aprox)

### Sidebar
- Logo "sweepsTOUCH" en la parte superior con ícono rosa/magenta
- Menú de navegación con iconos:
  - Subscribed Stores (ícono tienda)
  - Info Dashboard (ícono dashboard)
  - Manage Circulars (ícono documento)
  - Edit Circulars (ícono editar) - con flecha expandible
- Usuario en la parte inferior: "Benjamin Wallace" - "Circulars Management"

### Header
- Título de sección centrado ("Circulars")
- Botón de modo oscuro/claro (ícono luna)
- Avatar del usuario con notificación (punto azul)

## Pantallas Identificadas

### 1. Subscribed Stores
- **Métricas superiores**: 3 tarjetas con bordes de colores
  - Total Stores: 3 (borde azul)
  - Active Stores: 2 (borde verde)
  - Inactive Stores: 1 (borde rojo)
- **Botón principal**: "Subscribe New Store" (rosa/magenta)
- **Tabla**: Store Management con columnas:
  - STORE (con iniciales y dirección)
  - CONTACT (email y teléfono)
  - STATUS (badges Active/Inactive)
  - CREATED (fecha)
  - ACTIONS (iconos ver, editar, eliminar, más)

### 2. Info Dashboard
- **Métricas superiores**: 4 tarjetas con iconos y bordes de colores
  - Total Stores: 4 (ícono carrito, borde rosa, "+2 this month")
  - Active Circulars: 3 (ícono gráfico, borde verde, "Currently running")
  - Scheduled: 1 (ícono reloj, borde naranja, "Ready to launch")
  - Expired: 1 (ícono exclamación, borde rojo, "Need attention")
- **Status Alerts**: 2 alertas
  - Roja: "1 circular(s) need to be updated"
  - Azul: "1 circular(s) ready to launch"
- **Store Status Overview**: Lista de tiendas con estados y fechas

### 3. Manage Circulars
- **Métricas superiores**: 3 tarjetas
  - Active Circulars: 2 (borde verde)
  - Scheduled: 1 (borde naranja)
  - Expired: 1 (borde rojo)
- **Tabla**: Circular Status by Store
  - STORE, CONTACT, CURRENT CIRCULAR, NEXT CIRCULAR, PREVIEW
  - Estados: Active, Inactive, Expired

### 4. Edit Circulars (Upload Files)
- **Botones superiores**: "Instructions" y "Save Changes" (rosa)
- **Upload Area**: Drag & drop con ícono de nube
  - "Click to upload or drag and drop documents here. (Max 10MB each)"
- **Uploaded Files**: Lista de archivos subidos
- **Circular Schedule Management**: Tabla con fechas
  - STORE, START DATE, END DATE, STATUS, ACTIONS
  - Campos de fecha con formato dd/mm/yyyy
  - Estados: Incomplete (rojo)

### 5. Schedule Circulars
- Similar a Edit Circulars pero sin archivos subidos
- Solo botón "Instructions" (sin Save Changes)

### 6. Instructions Modal
- Modal overlay con fondo semi-transparente
- Contenido centrado con título "Instructions"
- Lista de instrucciones:
  - Upload PDF files using drag-and-drop
  - Set start and end dates
  - Dates are locked once saved
  - All stores must have both dates
  - Use trash icon to delete scheduled circulars
- Botón X para cerrar

## Elementos de UI Identificados

### Colores
- **Primary (Rosa/Magenta)**: #E91E63 o similar
- **Verde (Success)**: #4CAF50
- **Naranja (Warning)**: #FF9800
- **Rojo (Error)**: #F44336
- **Azul (Info)**: #2196F3
- **Gris oscuro (Sidebar)**: #2D3748
- **Gris claro (Background)**: #F7FAFC

### Componentes
- **Cards**: Bordes redondeados, sombra sutil, bordes de colores en la parte superior
- **Badges**: Redondeados, colores según estado
- **Buttons**: Redondeados, colores sólidos
- **Tables**: Headers con fondo gris, filas alternadas
- **Upload Area**: Borde punteado, ícono centrado
- **Modal**: Overlay oscuro, contenido centrado con bordes redondeados

### Iconos (Material UI)
- Store, Dashboard, Description, Edit, Visibility, Delete
- ShoppingCart, TrendingUp, Schedule, Error
- CloudUpload, Calendar, Phone, Email
- DarkMode, Notifications, Avatar

### Tipografía
- **Títulos**: Bold, tamaño grande
- **Subtítulos**: Medium, gris
- **Texto normal**: Regular
- **Badges**: Small, bold
