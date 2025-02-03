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

# Setup
To setup the project for your homelab, the easiest setup is to create a `docker-compose.yaml` to deploy everything.

// TODO

 # Usage
 The purpose of this API is to provide an API endpoint to CRUD management of your DNS Zones and Routes. Once your CoreDNS instance and CoreDNS API instance is deployed you can view the OpenAPI docs located at the `/docs` endpoint of the CoreDNS API.



# Development Setup
CoreDNS API is a Nodejs app using the Nestjs framework. If you would like to dig around the code yourself, or modify and add to the logic, you'll want to be able to set it up for development. You will need `docker` installed, and at minimum `node` v18 LTS installed. This can be done via the following:
1. Clone the repo
2. `cd` into the project root
3. Create your volume folders by running the following command:
    ```bash
    mkdir -p ./config/zones
    touch ./config/Corefile
    chmod -R 644 ./config
    ```
4. Paste the following `Corefile` configuration into the `./config/Corefile`:
    ```
    .:53 {
        forward . 8.8.8.8 8.8.4.4
        log
        errors
        health :8080
        reload
    }
    ```
3. Create an `.env` file with the following
    ```.env
    PORT=3000
    SWAGGER_PORT=3000
    COREDNS_CONFIG_ROOT=/etc/coredns
    ENABLE_DEBUG_LOGGING=true
    ```
    There are a few other settings available, described further down this README, but this should be enough to get your started
3. Run `docker compose up` . This will build the docker container and then setup the dev configuration

**Note:** If you run into issues or errors with `npm` installing packages, you may need to pass `--legacy-peer-deps`. This project uses Nestjs v10 and not all modules have officially updated or released compatible dependencies. They all work, they just haven't updated their `package.json` versions to allow the new version of Nestjs

# Configuration Options
CoreDNS API can be configured with a number of environment variable values. The easiest way to set these is via `.env` files. CoreDNS API has been designed to overlap with a number of common `.env` values so that settings made in the `.env` will be picked up by docker compose and the application consistently.

All of the `.env` values are as follows:
| Key | Required | Description | Default |
| --- | -------- | ----------- | ------- |
| `COREDNS_CONFIG_ROOT` | Yes | Specify the path in the container the folder where the `Corefile`. The `zones` folder is assumed to be a subfolder within this root folder and will store all zone files within it. Youll want to make sure your volume mounts mount into this folder | N/A |
| `PORT` | No | Specify the listening port for the app | `3000` |
| `ENABLED_DEBUG_LOGGING` | No | Enabled more verbose logging output | `false`
| `SWAGGER_PORT` | No | On the Swagger docs page, specify what port to hit to test calls | IF `WITH_SSL` is `false` - `80` . IF `WITH_SSL` is `true` - `443` |
| `WITH_SSL` | No | On the Swagger docs page, specify whether to use HTTP or HTTPS when testing calls | `false` |

## Modifying the `Corefile`
 The CoreDNS API will handle creation, modification and deletion of both the `Corefile` and zone files within the `COREDNS_CONFIG_ROOT` defined folder path. Ideally, this environment variable should be set to `/etc/coredns`. You can add additional stanzas into the `Corefile` as you would like. The CoreDNS API will modify the file around your changes.
 
 You can modify the default stanza required during setup _a little bit_.Certain configurations are required for minimum functionality and integration between CoreDNS and the CoreDNS API. Below is the minimum stanza:
 ```
.:53 {
    forward . 8.8.8.8 8.8.4.4
    log
    errors
    health :8080
    reload
}
```
Here is a breakdown of what within it can be changed:
| Line | Editable | Limitations |
| ---- | -------- | ----------- |
| `.:53 {` | No | This allows all traffic to enter via port 53. Port 53 currently is hardcoded in a bunch of the CoreDNS API. If you can not listen on port 53, CoreDNS API can not manage your CoreDNS server at this time |
| `forward . 8.8.8.8 8.8.4.4` | Yes | Can remove and/or modify this as much as you like. See https://coredns.io/plugins/forward/ for details |
| `log` | Yes | Can remove and/or modify this as much as you like. See  https://coredns.io/plugins/log/ for details |
| `errors` | Yes | Can remove and/or modify this as much as you like. See https://coredns.io/plugins/errors/ for details |
| `health :8080` | No | Used for integration and dependent modules to ensure CoreDNS is up and running before proceeding |
| `reload` | No | This is required so that when CoreDNS API makes changes to the `Corefile`, those changes are picked up. Removing this will break CoreDNS API integration with CoreDNS |