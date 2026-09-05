# Full stack Raspberry Pi setup (Docker, Cloudflare Tunnels, Mosquitto, Nginx, Node.js API)

Step-by-step instructions for deploying the Home Control stack on a Raspberry Pi or Linux server with Docker Compose and Cloudflare Tunnels.

---

## Stack overview

```
[ Public Client ]
       │
  (HTTPS Requests)
       ▼
[ Cloudflare Edge ]
       │
 (Encrypted Tunnel)
       ▼
[ cloudflared Container ]
       ├──► http://webapp:80 ------------► [ webapp (Nginx) Container ] (Next.js frontend)
       └──► http://pwhomecontroller:3800 --► [ pwhomecontroller Container ] (Node.js API)
                                                      │
                                                      ├──► [ mosquitto Container:1883 ] (MQTT broker)
                                                      └──► Local IoT hardware (HTTP/Zigbee/Tasmota)
```



### Components

1. **Frontend (**`webapp`**).** Static Next.js export served by Nginx, with rewrite rules for SPA routing.
2. **Backend API (**`pwhomecontroller`**).** Node.js control server for MQTT brokers, HTTP devices, vent controllers, and auth.
3. **MQTT broker (**`mosquitto`**).** Eclipse Mosquitto for device messaging and state sync.
4. **Ingress (**`cloudflared`**).** Outbound-only tunnel to custom domains. No inbound router ports. SSL at the Cloudflare edge.

---



## Prerequisites

- **Hardware:** Raspberry Pi 3B/4/5 or equivalent Linux ARM host.
- **Software:** Docker and the Docker Compose plugin (`docker compose version`).
- **Domain:** A domain managed in Cloudflare DNS.
- **Cloudflare Zero Trust:** An active workspace (free tier is enough).

---



## Recommended host directory structure

On the Pi:

```bash
mkdir -p ~/home-control/html
mkdir -p /opt/mosquitto
mkdir -p /opt/home-app/config
```

Layout:

```
~/home-control/
├── docker-compose.yaml
├── nginx.conf
└── html/                  # Compiled Next.js static files (out directory)
    ├── index.html
    ├── _.html
    └── ...

/opt/mosquitto/            # Persistent Mosquitto config and logs
/opt/home-app/config/      # Persistent backend configuration (env.config.js)
```

---



## Step-by-step setup



### Step 1: Configure Cloudflare Tunnel

1. Log in to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2. Go to **Networks** > **Tunnels** and click **Create a Tunnel**.
3. Select **Cloudflared** and name it (for example `pi-home-control`).
4. Choose the **Docker** environment and copy the `TUNNEL_TOKEN`.
5. Under **Public Hostnames**, add these routes:


| Subdomain / Domain     | Type   | URL (internal container DNS) | Description |
| ---------------------- | ------ | ---------------------------- | ----------- |
| `hc.yourdomain.com`    | `HTTP` | `webapp:80`                  | Frontend    |
| `hcapi.yourdomain.com` | `HTTP` | `pwhomecontroller:3800`      | Backend API |


Use `http://` for internal container endpoints, not `https://`. SSL terminates at Cloudflare.

---



### Step 2: Frontend Nginx rewrites (`nginx.conf`)

Nginx ignores Apache `.htaccess` files. Save this as `~/home-control/nginx.conf` so Next.js static export routes (`.html` and fallbacks) work:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Disable directory listing
    autoindex off;

    location / {
        # 1. Look for exact file ($uri)
        # 2. Look for exact directory ($uri/)
        # 3. Look for Next.js static .html file ($uri.html)
        # 4. Fallback to /_.html (catch-all route) or /index.html
        try_files $uri $uri/ $uri.html /_.html /index.html;
    }

    # Custom 404 page fallback
    error_page 404 /404.html;
}
```

---



### Step 3: Backend configuration (`env.config.js`)

Create `/opt/home-app/config/env.config.js`:

```javascript
module.exports = {
    "port": 3800,
    "appEndpoint": "https://hc.yourdomain.com",
    "apiEndpoint": "https://hcapi.yourdomain.com",
    "ssl_cert": "",
    "ssl_key": "",
    "ca_cert": "",
    "jwt_secret": "replace-with-a-long-random-secret-key",
    "jwt_expiration_in_seconds": 36000,
    "mqtt": {
        "url": "mosquitto:1883",
        "username": "",
        "password": ""
    },
    "environment": "prod",
    "devices": {
        "garage": { "mqttName": "tas_garage" },
        "speakers": { "mqttName": "sonoff_speakers" },
        "blinds": { "baseUrl": "http://192.168.2.102" },
        "server": { "mqttName": "sonoff_server", "companionBaseUrl": "http://192.168.1.77:8200" }
    },
    "appLayout": {
        /* Define your pages, widgets, and sidebar layout */
    },
    "permissionLevels": {
        "NORMAL_USER": 1,
        "ADMIN_USER": 4096
    },
    "users": [
        /* Add initial users or generate hashed credentials via /users endpoint */
    ]
};
```

---



### Step 4: Create `docker-compose.yaml`

In `~/home-control/docker-compose.yaml`:

```yaml
services:
  webapp:
    image: nginx:alpine
    container_name: webapp
    restart: unless-stopped
    volumes:
      - ./html:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: cloudflared
    platform: linux/arm64
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=YOUR_CLOUDFLARE_TUNNEL_TOKEN_HERE
    depends_on:
      - webapp

  mosquitto:
    image: eclipse-mosquitto
    container_name: mosquitto
    restart: unless-stopped
    ports:
      - "1883:1883"
    volumes:
      - /opt/mosquitto:/mosquitto

  pwhomecontroller:
    image: pierowheelz/home-app-backend:latest
    container_name: pwhomecontroller
    platform: linux/arm/v7
    restart: unless-stopped
    ports:
      - "3600:3800"
    environment:
      - NODE_VERSION=16.15.0
      - YARN_VERSION=1.22.18
    volumes:
      - /etc/letsencrypt:/keys
      - /opt/home-app/config:/config
    depends_on:
      - mosquitto
```

---



### Step 5: Build and deploy

1. **Frontend.** Export Next.js (`npm run build && npm run export`) and copy `out/` into `~/home-control/html/` on the Pi.
2. **Launch:**

```bash
cd ~/home-control
docker compose up -d
```

1. **Check status:**

```bash
docker compose ps
```

---



## Troubleshooting



### 1. `502 Bad Gateway` from Cloudflare

- **Cause:** The tunnel cannot reach the container name or port.
- **Solution:** Point public hostnames at `http://webapp:80` and `http://pwhomecontroller:3800`. Not `https://`, not `localhost`.



### 2. `validating docker-compose.yaml: additional properties not allowed`

- **Cause:** Missing `services:` or bad YAML indentation (tabs instead of spaces).
- **Solution:** Keep `services:` at the top level and indent with spaces.



### 3. API / MQTT disconnects

- **Cause:** Wrong host in `env.config.js`.
- **Solution:** Set `"mqtt.url": "mosquitto:1883"` so the backend uses Docker's internal network.



### 4. CORS errors in the browser

- **Cause:** Frontend (`hc.yourdomain.com`) and API (`hcapi.yourdomain.com`) are different origins.
- **Solution:** Allow CORS for the frontend origin on the Node.js API.

### 5. `no matching manifest for linux/arm/v8 in the manifest list entries`

- **Cause:** Docker is pulling an image (often `cloudflared`) for `linux/arm/v8`, which that image does not publish.
- **Solution:** Pin the architecture under the `cloudflared` service:

```yaml
  cloudflared:
    platform: linux/arm64
```

---



## Maintenance

**Logs:**

```bash
docker compose logs -f pwhomecontroller
docker compose logs -f cloudflared
```

**Restart a service:**

```bash
docker compose restart webapp
```

**Update images:**

```bash
docker compose pull
docker compose up -d
```

