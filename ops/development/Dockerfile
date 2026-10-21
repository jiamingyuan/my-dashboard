FROM debian:trixie AS development

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

# Tooling for development and pjkp runs directly in the container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends git python3 \
    && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
RUN npx --yes --package=@playwright/test@1.64.1 playwright install --with-deps chromium \
    && npm cache clean --force

WORKDIR /app/my-dashboard
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1/ > /dev/null || exit 1

# Source and Linux dependencies live in the named my-dashboard-project volume.
CMD ["node", "node_modules/vite/bin/vite.js", "--host", "0.0.0.0", "--port", "80", "--strictPort"]
