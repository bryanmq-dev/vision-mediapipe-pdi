## Instalación manual

### Creación de proyecto

```
pnpm create vite@latest vision-mediapipe
```

### Paquetes

```
pnpm i @mediapipe/camera_utils @mediapipe/hands @mediapipe/face_mesh
```

## Instalación desde Repositorio

```
git clone https://github.com/bryanmq-dev/vision-mediapipe.git
cd vision-mediapipe
pnpm i
pnpm run dev
```

## Kernels de ejemplo

Sobel horizontal

```
-1,-2,-1,0,0,0,1,2,1
```

Sobel Vertical

```
1,0,-1,2,0,-2,1,0,-1
```
