# SOA Project — Tourism Platform

A microservices-based tourism application built as a Service-Oriented Architecture faculty project. Tourists browse and purchase guided tours, tour guides create and manage tours, and the platform layers in social features (blogs, following, reviews) plus a full observability stack.

> **Status:** This branch consolidates all feature branches developed throughout the project into `main`, which had fallen behind. It's kept here as a **code showcase** — it reflects the final state of the implementation work rather than a maintained, guaranteed-to-run deployment.

## Architecture

The system is split into independently deployable services, registered with a Eureka service registry and fronted by an API gateway.

```
                         ┌─────────────┐
                         │   Frontend   │  React + Vite
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │ API Gateway │  Ocelot (.NET) + gRPC-Gateway
                         └──────┬──────┘
                                │
        ┌───────────┬──────────┼───────────┬──────────────┐
        │            │          │           │              │
 ┌──────▼─────┐┌─────▼─────┐┌───▼──────┐┌───▼───────┐┌─────▼──────┐
 │Stakeholders││    Blog    ││   Tour   ││ Followers ││  Purchase   │
 │  (Go)      ││   (Go)     ││  (.NET)  ││  (.NET)   ││   (.NET)    │
 └──────┬─────┘└─────┬──────┘└───┬──────┘└─────┬─────┘└─────┬──────┘
        │            │           │             │            │
    MySQL         MySQL       MongoDB       Neo4j         MySQL

           Eureka Server (Java/Spring) — service discovery
           MinIO — object storage for images
           Prometheus + Grafana + Loki + Fluent Bit + Jaeger — observability
```

### Services

| Service | Stack | Responsibility |
|---|---|---|
| `frontend` | React, Vite, Tailwind, Radix UI, Leaflet | SPA for tourists, guides and admins |
| `api-gateway` | .NET (Ocelot) | Single entry point, routing to backend services |
| `eureka-server` | Java (Spring Cloud Netflix Eureka) | Service discovery/registry |
| `stakeholders-service` | Go | Auth, users (tourist/guide/admin), profiles, gRPC user info, image storage via MinIO |
| `blog-service` | Go | Blog posts, likes, comments, MySQL-backed |
| `tour-service` | .NET / MongoDB | Tours, tour execution & activation, reviews, routing, position tracking |
| `followers-service` | .NET / Neo4j | Follow/following graph, recommendations |
| `purchase-service` | .NET / MySQL | Shopping cart, tour purchases, purchase verification (gRPC) |
| `protos/` | gRPC/Protobuf | Shared `.proto` contracts + generated Go gRPC-Gateway code (stakeholders, purchase) |

### Observability stack

- **Prometheus** — metrics scraping
- **Grafana** — dashboards (provisioned)
- **Loki + Fluent Bit** — centralized log aggregation
- **Jaeger** — distributed tracing (OpenTelemetry exporters wired into the .NET services)

## Features

Consolidated from the project's feature branches:

- **Auth & stakeholders** — registration/login (tourist, guide, admin), JWT auth, admin profile view
- **Tours** — create/edit tours, tour activation, tour location & map (Leaflet + km calculation), tour execution with live position simulation
- **Blog** — create posts, like/comment, username & photo shown on posts and comments
- **Social** — follow/unfollow other users, followers/following pages, follow-based recommendations, community view
- **Reviews** — tourists can review tours
- **Shopping cart & purchases** — add tours to cart, purchase flow, "my purchased tours" page
- **Cross-service communication** — gRPC between stakeholders-service and other services, gRPC-Gateway for REST-over-gRPC on login/registration
- **Observability** — logging, tracing and monitoring wired across services (Prometheus, Grafana, Loki, Jaeger)

## Repository structure

```
.
├── frontend/                 # React SPA
├── api-gateway/              # Ocelot API gateway (.NET)
├── eureka-server/            # Spring Cloud Eureka registry
├── services/
│   ├── stakeholders-service/ # Go
│   ├── blog-service/         # Go
│   ├── tour-service/         # .NET
│   ├── followers-service/    # .NET
│   └── purchase-service/     # .NET
├── protos/                   # Shared gRPC contracts + generated gateway code
├── observability/            # Prometheus / Grafana / Fluent Bit configs
├── certs/                    # Local dev TLS certs for purchase-service
└── docker-compose.yml        # Full multi-service stack
```

## Running it (as-is, best effort)

This was assembled from several previously-unmerged feature branches for portfolio purposes, so treat it as source to read rather than a guaranteed one-command deploy.

```bash
git clone https://github.com/tijanicica/soa-project.git
cd soa-project
docker-compose up --build
```

If it comes up, services are reachable at:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Stakeholders service: http://localhost:8001
- Blog service: http://localhost:8002
- Tour service: http://localhost:8003
- Followers service: http://localhost:8004
- Purchase service: http://localhost:8005
- Eureka dashboard: http://localhost:8761
- MinIO console: http://localhost:9001
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Jaeger UI: http://localhost:16686

## History note

`main` originally tracked only the earliest merged pull requests (through tour-location/reviews). The bulk of later work — followers, purchase/shopping cart, tour activation, gRPC gateway, and the logging/tracing/monitoring stack — landed on `develop` and `fixing-clean-code` but was never fast-forwarded into `main`. This branch merges `fixing-clean-code` (the most complete branch) into `main` to bring all of that code together in one place.
