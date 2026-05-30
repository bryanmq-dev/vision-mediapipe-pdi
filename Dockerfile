# ---------- Etapa de construcción (Build) ----------
FROM node:22-alpine AS build

# Habilitar corepack para usar pnpm (ya que tienes pnpm-lock.yaml)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Establecer nuestro directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo los archivos de dependencias primero (para optimizar caché)
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto de los archivos del proyecto
COPY . .

# Construir el proyecto Vite para producción (crea la carpeta dist/)
RUN pnpm run build

# ---------- Etapa de Producción (Servir) ----------
FROM nginx:alpine

# Copiar los recursos construidos de la etapa anterior al servidor web Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Opcional: Copiar tu propia configuración de Nginx si tienes reglas especiales (rutas para Vue)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto por el que escuchará Nginx
EXPOSE 80

# Comando para ejecutar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
