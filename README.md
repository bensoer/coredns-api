# CoreDNS API
CoreDNS API is a simple containerised API, allowing you to manage the CoreDNS service from an API endpoint. 

This project is designed for homelab usage where you want to setup a custom domain for resolving services within your local LAN. It is intended to be deployed as a docker container or with docker compose along side the CoreDNS service.

If you want to learn more about how to setup CoreDNS as a private server in your local network, checkout the following linkes:
- https://coredns.io/manual/toc/
- https://dev.to/robbmanes/running-coredns-as-a-dns-server-in-a-container-1d0

This API was built off of my own exploration of CoreDNS as a private DNS service for my homelab. You can read about my experience here in this shameless self plug: https://medium.com/@bensoer/setup-a-private-homelab-dns-server-using-coredns-and-docker-edcfdded841a

# Prerequisites
To use CoreDNS API, the following tools need to be installed on your system:
- Docker

For development, you will also need at minimum:
- Node v18 LTS

# Setup
To setup the project for your homelab, the easiest setup is to create a `docker-compose.yaml` to deploy everything.
```yaml
volumes:
  coredns:

services:
  coredns:
    image: coredns/coredns:latest
    restart: unless-stopped
    container_name: coredns
    command: -conf /etc/coredns/Corefile -dns.port 53
    ports:
      - "53:53/udp"
    volumes:
      - ./config:/etc/coredns
    depends_on:
      - corednsapi
  corednsapi:
    image: ghcr.io/bensoer/coredns-api:latest
    container_name: coredns-api
    restart: unless-stopped
    ports: 
      - 3000:3000
    volumes:
      - ./config:/etc/coredns
    environment:
      # (Required) Set the root location where all configurations are stored. This is so that the API knows where to store config for CoreDNS to pickup
      COREDNS_ROOT_FOLDER: /etc/coredns
      # (Optional) Set to the same as your external port if you want to be able to make calls with the swagger UI
      SWAGGER_PORT: '3000' 
      # (Optional) If serving CoreDNS API over HTTPS and want the Swagger UI to be able to hit it - set this to true
      # USE_SSL: 'false'
      
```
Make sure to grab the latest release version of the Core DNS API container: https://github.com/bensoer/coredns-api/pkgs/container/coredns-api

You can also see an example docker-compose.yaml within the `example` folder of this repo

See the [Configuration Options](#configuration-options) section for all `environment` values.


# Usage
The purpose of this API is to provide an API endpoint to CRUD management of your DNS Zones and Routes. Once your CoreDNS instance and CoreDNS API instance is deployed you can view the OpenAPI docs located at the `/docs` endpoint of the CoreDNS API.

# Development Setup
CoreDNS API is a Nodejs app using the Nestjs framework. If you would like to dig around the code yourself, or modify and add to the logic, you'll want to be able to set it up for development. This can be done via the following:

1. Clone the repo
2. `cd` into the project root
3. Create your volume folders by running the following command:
    ```bash
    mkdir -p ./config
    chmod -R 755 ./config
    ```
4. Create an `.env` file with the following
    ```.env
    PORT=3000
    SWAGGER_PORT=3000
    NODE_ENV=development
    ENABLE_DEBUG_LOGGING=true
    COREDNS_CONFIG_ROOT=/etc/coredns
    ```
5. Run `docker compose up` . This will build the docker container and then setup the dev configuration
6. (Optional / Beta ) You can generate code documentation by running:
   ```bash
   npm run compodoc
   ```
   This will generate static HTML providing an overview of class dependencies, methods and any commented documentation provided. Generated HTML will appear in a new folder `compodocs`. Open the `index.html` file with a browser to view and navigate.


**Note:** If you run into issues or errors with `npm` installing packages, you may need to pass `--legacy-peer-deps`. This project uses Nestjs v10 and not all modules have officially updated or released compatible dependencies. They all work, they just haven't updated their `package.json` versions to allow the new version of Nestjs

# Configuration Options
CoreDNS API can be configured with a number of environment variable values. These values can be passed as environment variables or in a `.env` file. If developing the CoreDNS API, its easier if they are put in an `.env` file. CoreDNS API has been designed to overlap with a number of common `.env` values so that settings made in the `.env` will be picked up by docker compose and the container consistently.

All of the environment configuration values are as follows:
| Key | Required | Description | Default |
| --- | -------- | ----------- | ------- |
| `PORT` | No | Specify the listening port for the app | `3000` |
| `ENABLED_DEBUG_LOGGING` | No | Enabled more verbose logging output | `false`
| `SWAGGER_PORT` | No | On the Swagger docs page, specify what port to hit to test calls | IF `WITH_SSL` is `false` - `80` . IF `WITH_SSL` is `true` - `443` |
| `WITH_SSL` | No | On the Swagger docs page, specify whether to use HTTP or HTTPS when testing calls | `false` |
| `NODE_ENV` | No | Specify what environment is booting. The container sets this value to `production`. For dev environments with docker-compose, this value must be overridden as `development` otherwise `npm` will not install all dependencies correctly | `production` |
| `COREDNS_CONFIG_ROOT` | Yes | Specify where the root folder is for all configuration. CoreDNS API will store its SQLite directory in here along with all Corefiles and configurations. Set this folder path to coordinate working with your CoreDNS container | N/A |
| `DNS_FORWARD_ADDRESSES` | No | Override where CoreDNS will send requests it does not know to. This value can only be set on first startup. Following startups it is ingored. | `8.8.8.8 8.8.4.4` |

## Modifying the `Corefile`
The CoreDNS API handles all modifications necessary for `Corefile` configuration. Using the `import` plugin, its able to dynamically generate configuration. If you want to add your own custom logic, you can do this by adding it to the generated root `Corefile` located within the folder, set by the `COREDNS_CONFIG_ROOT` environment variable, within the container. Within it you will find the following:
```
import ./Corefile.d/*
```
This single line allows the CoreDNS API to configure and coordinate with CoreDNS. This line _must_ be left as is. Anything _below_ the line though, you may add and edit as you would like, and CoreDNS will read this in on its next reload. Reloads run using the `reload` plugin which rescans all files every 45 seconds. So you can make and save your changes while CoreDNS and CoreDNS API is still running and have them loaded on the next reload.

**Note:** The root `$(COREDNS_CONFIG_ROOT)/Corefile` is generated by the CoreDNS API at first boot. Its preferrable to startup the API and then apply your modifications. However, as long as the `import` statement described earlier is defined, you can supply your own `Corefile` at `$(COREDNS_CONFIG_ROOT)/Corefile` and CoreDNS API will skill generating the file. If your changes break CoreDNS, the CoreDNS API will be unable to fix it. Delete the `$(COREDNS_CONFIG_ROOT)/Corefile` and restart the CoreDNS API to have it regenerated