FROM debian:trixie AS build

ARG NODE_VERSION=24.20.0
ENV PATH="/opt/node/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install the same Node major used by the project, checking the official checksum.
RUN set -eu; \
    case "$(dpkg --print-architecture)" in \
      arm64) node_arch=arm64 ;; \
      amd64) node_arch=x64 ;; \
      *) printf 'Unsupported architecture\n' >&2; exit 1 ;; \
    esac; \
    node_file="node-v${NODE_VERSION}-linux-${node_arch}.tar.xz"; \
    cd /tmp; \
    curl -fsSLO --retry 3 "https://nodejs.org/dist/v${NODE_VERSION}/${node_file}"; \
    curl -fsSLO --retry 3 "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"; \
    grep " ${node_file}$" SHASUMS256.txt | sha256sum -c -; \
    mkdir -p /opt/node; \
    tar -xJf "${node_file}" --strip-components=1 -C /opt/node; \
    rm "${node_file}" SHASUMS256.txt

WORKDIR /app/my-dashboard
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM debian:trixie AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/my-dashboard
# Retain the project source and pjkp records alongside the Linux-built output.
# .dockerignore excludes host dependencies, private configuration and test output.
COPY . .
COPY --from=build /app/my-dashboard/dist ./dist
COPY ops/debian/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
