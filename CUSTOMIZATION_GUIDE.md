# Guía de Personalización de Vision-MediaPipe

Esta guía te ayudará a entender la estructura del proyecto y cómo puedes modificarlo a tu gusto usando Vue 3 (Composition API con `<script setup>`) y TypeScript.

## 1. Entendiendo la Estructura (Arquitectura)

Tu proyecto está construido basándose en **Componentes Visuales** (la interfaz) y **Composables** (la lógica reutilizable).

- **`App.vue / main.ts`**: Es el punto de entrada de la aplicación.
- **`components/CameraView.vue`**: Es el componente "padre" de la vista de cámara. Se encarga de:
  - Encender la cámara.
  - Dibujar el video y el canvas protector encima.
  - Orquestar la detección enviando los frames a MediaPipe (Manos y Rostro).
  - Dibujar el puntero (cursor verde) en el canvas.
- **`components/DemoPanel.vue`**: Es el panel de interfaz de usuario. Renderiza los menús, tarjetas y botones que el usuario ve en pantalla.
- **`components/HoverButton.vue`**: Es un botón dinámico inteligente. Sabe registrarse a sí mismo en el sistema para detectar si el dedo del usuario está sobre él.
- **`composables/`**: Son archivos de lógica pura extraída de los componentes para mantenerlos limpios.
  - `useCamera.ts`: Maneja el encendido/apagado de la webcam.
  - `useHandTracking.ts` / `useFaceMesh.ts`: Gestionan la configuración y conexión con MediaPipe.
  - `useHoverClick.ts`: Es el motor de físicas y colisiones. Compara la posición del dedo con las coordenadas de los botones registrados en pantalla.

---

## 2. Modificar el Tamaño del Canvas y Video

El lienzo donde MediaPipe dibuja (canvas) y el video subyacente se controlan desde **`CameraView.vue`**.

### Tamaño de Procesamiento

Busca estas variables en el `<script setup>` de `CameraView.vue`:

```typescript
const canvasWidth = 1280;
const canvasHeight = 720;
```

Este es el "tamaño interno" de procesamiento. Reducirlo (ej. 640x480) mejora el rendimiento en PCs lentas, pero reduce la precisión de la detección.

### Tamaño Visual en Pantalla

La cámara acapara toda la pantalla porque en `<style scoped>` de `CameraView.vue` tiene:

```css
.camera-view {
  width: 100vw;
  height: 100vh;
}
.camera-view__video {
  /* scaleX(-1) hace el efecto espejo (es vital para que al mover tu mano a la derecha, en pantalla vaya a la derecha) */
  transform: scaleX(-1);
  object-fit: cover; /* Llena toda la pantalla recortando los bordes si es necesario */
}
```

Si deseas que la cámara sea un recuadro pequeño, puedes cambiar `width: 100vw; height: 100vh;` por píxeles fijos (ej. `width: 800px; height: 600px;`) y el `object-fit: contain;`.

---

## 3. Personalizar la Disposición de los Elementos (Layout)

Los botones y cuadros de diálogo viven dentro de **`DemoPanel.vue`**.
Ese componente se inyecta encima del video gracias a `<slot />` que está dentro de `<div class="camera-view__overlay">` en `CameraView.vue`.

Si abres **`DemoPanel.vue`**, deberías estructurar la interfaz usando CSS convencional (CSS Flexbox o CSS Grid).
Por ejemplo, si quieres poner tu menú en la parte inferior de la pantalla en lugar de en el centro:

```css
/* En DemoPanel.vue (o tu contenedor principal de la UI) */
.mi-menu-inferior {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}
```

---

## 4. Crear/Modificar Acciones de los Botones

Los botones en la pantalla detectan si el "dedo" se mantiene sobre ellos. Esto se logra usando el componente **`HoverButton.vue`**.

Para agregar un botón nuevo que haga una acción específica, abre **`DemoPanel.vue`** y en su `<template>`:

```html
<HoverButton
  text="Haz click en mi!"
  color="#ff0055"
  @trigger="miAccionPersonalizada"
/>
```

Luego, en en el `<script setup>` del mismo `DemoPanel.vue`:

```typescript
// Define la acción que quieres que ocurra
function miAccionPersonalizada() {
  console.log("¡El usuario activó el botón con el dedo!");
  // Aquí podrías cambiar de página, activar un sonido,
  // cambiar el color del fondo, etc.
}
```

El evento `@trigger` es emitido por `HoverButton` internamente cuando la barra de progreso circular o de carga se llena al 100%.

---

## 5. Sintaxis de Vue que debes conocer para este proyecto

Vue.js hace que todo esto funcione bajo ciertas reglas. Aquí las principales enfocadas a tu código:

### a. Reactividad (`ref`)

Cuando el dedo se mueve, las coordenadas cambian constantemente. Usamos `ref` para crear variables reactivas. Si usaras variables normales de JS (ej `let x = 0`), la interfaz visual no se actualizaría.

```typescript
import { ref } from "vue";

const counter = ref(0);
// Para leer o cambiar el valor en el Script, debes usar .value
counter.value = counter.value + 1;

// Pero en el Template HTML, omites el .value
// <p>Contador: {{ counter }}</p>
```

### b. Provide / Inject (Comunicación de componentes)

¿Cómo sabe un `HoverButton` escondido dentro de un `DemoPanel` dónde está el dedo mágicamente?
`CameraView.vue` tiene las coordenadas del dedo, y hace un **`provide`**:

```typescript
// CameraView.vue dice: "Pongo esta función a disposición de mis hijos"
provide("registerHoverElement", registerElement);
```

Luego **`HoverButton.vue`** hace un **`inject`**:

```typescript
// HoverButton.vue dice: "Me apropio de la función que el papá dejó libre"
const registerHoverElement = inject("registerHoverElement");
```

Esto evita tener que pasar estas funciones manualmente componente por componente.

### c. `<slot />`

Si ves un `<slot />` en `CameraView.vue`, significa: _"Pega aquí adentro lo que sea que le pongas a la etiqueta de CameraView"_.

```html
<!-- En App.vue o main -->
<CameraView>
  <!-- Todo esto reemplazará al <slot /> en CameraView -->
  <DemoPanel />
</CameraView>
```

---

Con esto, tienes un panorama sólido para empezar a maquetar tu Interfaz (CSS en `DemoPanel.vue`), crear nuevas interacciones (métodos asignados en `@trigger`) y moldear la cámara a tus necesidades en `CameraView.vue`. ¡Éxito con tu proyecto visionario!
