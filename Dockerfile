ARG NODE_IMAGE=node:20-alpine

FROM ${NODE_IMAGE} AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production
# ECS/ALB expects 0.0.0.0:3000 by default
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built server output (and, if needed, node_modules)
COPY --from=build /app/.output ./.output

# in case nitro build not fully standalone
# COPY --from=build /app/node_modules ./node_modules
# copy Prisma schema if client expects it at runtime
# COPY --from=build /app/prisma ./prisma

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
