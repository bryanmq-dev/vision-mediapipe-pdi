## Requisitos previos
- NodeJs
- pnpm (manager de paquetes de node)

```bash
# En powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
iwr -useb https://get.pnpm.io/install.ps1 | iex
```

## Instalación manual

### Creación de proyecto

```bash
pnpm create vite@latest vision-mediapipe
```

### Paquetes

```bash
pnpm i @mediapipe/camera_utils @mediapipe/hands @mediapipe/face_mesh
```

## Instalación desde Repositorio

```bash
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
