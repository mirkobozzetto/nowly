FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /app
WORKDIR /app

RUN pnpm install --frozen-lockfile
RUN pnpm build:websites

EXPOSE 3001
CMD ["pnpm", "start:api"]
