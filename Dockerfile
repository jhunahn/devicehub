FROM node:20.18.0-bullseye-slim AS base

ENV DEBIAN_FRONTEND=noninteractive \
    BUNDLETOOL_REL=1.8.2

COPY cert /usr/local/share/ca-certificates
RUN apt-get update -q && apt-get upgrade -yq --no-install-recommends \
    && apt-get -qqy install \
        build-essential \
        ca-certificates \
        curl \
        git \
        graphicsmagick \
        nano \
        libzmq3-dev \
        libprotobuf-dev \
        iputils-ping \
        openjdk-11-jdk \
        python3 \
        yasm \
        wget \
    && apt-get clean \
    && rm -rf /var/cache/apt/* /var/lib/apt/lists/*

ADD https://github.com/google/bundletool/releases/download/${BUNDLETOOL_REL}/bundletool-all-${BUNDLETOOL_REL}.jar /tmp
RUN mkdir /tmp/bundletool && mv /tmp/bundletool-all-${BUNDLETOOL_REL}.jar /tmp/bundletool/bundletool.jar
RUN npm config set proxy ${http_proxy} \
    && npm config set https-proxy ${https_proxy} \
    && npm config set strict-ssl false

RUN useradd --system --create-home --shell /usr/sbin/nologin stf-build \
    && useradd --system --create-home --shell /usr/sbin/nologin stf \
    && cd /tmp \
    && su stf-build -s /bin/bash -c '/usr/local/lib/node_modules/npm/node_modules/node-gyp/bin/node-gyp.js install'

# Copy app source.
COPY . /tmp/build/

# Give permissions to our build user.
RUN mkdir -p /app && \
    chown -R stf-build:stf-build /tmp/build /tmp/bundletool /app

# Switch over to the build user.
USER stf-build

# Run the build.
RUN cd /tmp/build \
    && npm ci --python="/usr/bin/python3" --loglevel http && npm pack \
    && tar xzf vk-devicehub-*.tgz --strip-components 1 -C /app \
    && npm prune --production \
    && mv node_modules /app \
    && rm -rf ~/.node-gyp \
    && mv /tmp/bundletool /app \
    && cd /app \
    && find /tmp -mindepth 1 ! -regex '^/tmp/hsperfdata_root\(/.*\)?' -delete

# Switch to the app user.
USER stf
ENV PATH /app/bin:$PATH
WORKDIR /app

EXPOSE 3000

# Show help by default.
CMD stf --help
