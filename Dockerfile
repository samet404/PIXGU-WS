# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /app

# Setup Bun environment
RUN test -f ~/.zprofile || touch ~/.zprofile
RUN echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.zprofile
RUN echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.zprofile

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# RUN bun install -g npx

# Copy source code
COPY . .

ENV SKIP_ENV_VALIDATION=1

# Expose port (adjust as needed)
EXPOSE 3000
RUN chmod +x ./src/server.ts


# Start the server
CMD ["bun", "src/server.ts"]