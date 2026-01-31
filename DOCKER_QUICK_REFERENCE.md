# Docker Quick Reference - RideNDine

Quick reference card for Docker operations in RideNDine project.

## Quick Start (30 seconds)

```bash
# Start everything
npm run docker:up:detached

# Check status
npm run docker:ps

# Test API
curl http://localhost:9001/health

# Stop everything
npm run docker:down
```

## Build Commands

```bash
# Build all services
npm run docker:build

# Clean build (no cache)
npm run docker:build:nocache

# Build specific service
docker-compose build api
```

## Start/Stop Commands

```bash
# Start all (attached - see logs)
npm run docker:up

# Start all (detached - background)
npm run docker:up:detached

# Stop all services
npm run docker:down

# Restart all services
npm run docker:restart

# Restart specific service
docker-compose restart api
```

## Monitoring Commands

```bash
# Check container status
npm run docker:ps

# View all logs (live)
npm run docker:logs

# View specific service logs
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 api

# Container resource usage
docker stats

# Inspect health check
docker inspect ridendine_api | grep -A 10 Health
```

## Database Commands

```bash
# Start only databases
npm run db:up

# Stop only databases
npm run db:down

# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed

# Full reset (WARNING: deletes all data)
npm run db:reset

# Connect to database
psql postgresql://ridendine:ridendine_dev_password@localhost:5432/ridendine_dev
```

## Debugging Commands

```bash
# Enter container shell
docker-compose exec api sh

# View container processes
docker-compose top api

# Check container logs since specific time
docker-compose logs --since 10m api

# Follow logs for multiple services
docker-compose logs -f api postgres redis

# Inspect container config
docker inspect ridendine_api
```

## Cleanup Commands

```bash
# Remove containers and networks
npm run docker:down

# Remove containers, networks, and volumes
npm run docker:clean

# Nuclear option (remove everything)
docker-compose down -v --rmi all

# Clean up unused Docker resources
docker system prune -a --volumes
```

## Service Endpoints

| Service    | URL                            | Description       |
| ---------- | ------------------------------ | ----------------- |
| API        | http://localhost:9001          | Main REST API     |
| API Health | http://localhost:9001/health   | Health check      |
| API Docs   | http://localhost:9001/api/docs | Swagger UI        |
| Dispatch   | http://localhost:9002          | Dispatch service  |
| Routing    | http://localhost:9003          | Routing service   |
| Realtime   | ws://localhost:9004            | WebSocket gateway |
| PostgreSQL | localhost:5432                 | Database          |
| Redis      | localhost:6379                 | Cache             |
| Adminer    | http://localhost:8080          | DB Admin UI       |

## Common Issues

### Port Already in Use

```bash
# Find and kill process
lsof -i :9001
kill $(lsof -t -i :9001)

# Or change port in docker-compose.yml
ports:
  - "9002:9001"  # Host:Container
```

### Container Won't Start

```bash
# Check logs
docker-compose logs api

# Rebuild
docker-compose build api
docker-compose up api

# Force recreate
docker-compose up --force-recreate api
```

### Unhealthy Status

```bash
# Wait 30 seconds (health checks take time)
sleep 30 && npm run docker:ps

# Check health details
docker inspect ridendine_api | grep -A 20 Health

# Test endpoint manually
curl http://localhost:9001/health
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Wait for health check
sleep 10 && docker-compose ps postgres
```

### Out of Memory

```bash
# Check resource usage
docker stats

# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory → 4GB+

# Stop unnecessary containers
docker stop $(docker ps -aq)
```

## Development Workflows

### Full Docker Development

```bash
# Start stack
npm run docker:up:detached

# Make code changes
# Edit files in services/api/src/

# Rebuild and restart
npm run docker:build
npm run docker:restart

# View logs
npm run docker:logs
```

### Hybrid Development (Faster)

```bash
# Start only databases
npm run db:up

# Run services locally with hot-reload
npm run dev:api        # Terminal 1
npm run dev:dispatch   # Terminal 2
npm run dev:routing    # Terminal 3
npm run dev:realtime   # Terminal 4

# Stop databases when done
npm run db:down
```

## Health Check Status

Each service has a health check. Check with:

```bash
docker-compose ps
```

**Status meanings:**

- `starting` - Container just started, health check not run yet
- `healthy` - Health check passing
- `unhealthy` - Health check failing (check logs)

**Wait time**: Allow 30 seconds for all services to become healthy.

## Environment Variables

Override environment variables:

```bash
# Via .env file
echo "API_PORT=9005" >> .env

# Via command line
API_PORT=9005 docker-compose up api

# View current environment
docker-compose config
```

## Docker Compose Profiles (Future)

Not yet implemented, but planned:

```bash
# Start only core services
docker-compose --profile core up

# Start with monitoring
docker-compose --profile monitoring up

# Start full stack with all tools
docker-compose --profile all up
```

## Performance Tips

1. **Layer Caching**: Don't rebuild unnecessarily

   ```bash
   # Use cached layers
   npm run docker:build

   # Only if dockerfile changed
   npm run docker:build:nocache
   ```

2. **Selective Restarts**: Only restart what changed

   ```bash
   # Don't restart database if only API changed
   docker-compose restart api
   ```

3. **Volume Mounts**: For faster dev iteration (future)

   ```yaml
   volumes:
     - ./services/api/src:/app/src:ro
   ```

4. **Build Context**: .dockerignore is optimized
   ```bash
   # Already excluded: node_modules, .git, docs
   ```

## Advanced Operations

### Backup Database

```bash
docker-compose exec postgres pg_dump -U ridendine ridendine_dev > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker-compose exec -T postgres psql -U ridendine ridendine_dev
```

### Execute SQL

```bash
docker-compose exec postgres psql -U ridendine ridendine_dev -c "SELECT * FROM users LIMIT 5;"
```

### Copy Files to Container

```bash
docker cp local_file.txt ridendine_api:/app/
```

### Copy Files from Container

```bash
docker cp ridendine_api:/app/logs/error.log ./
```

## Image Management

```bash
# List images
docker images | grep ridendine

# Remove specific image
docker rmi ridendine-api:latest

# Remove all RideNDine images
docker rmi $(docker images | grep ridendine | awk '{print $3}')

# Check image size
docker images ridendine-api

# View image layers
docker history ridendine-api:latest
```

## Network Debugging

```bash
# List networks
docker network ls

# Inspect network
docker network inspect ridendine_ridendine_network

# Test connectivity between containers
docker-compose exec api ping postgres
docker-compose exec api curl http://redis:6379

# View network traffic (requires tcpdump in container)
docker-compose exec api tcpdump -i any port 5432
```

## Useful Aliases (Add to ~/.bashrc or ~/.zshrc)

```bash
alias dcu="npm run docker:up:detached"
alias dcd="npm run docker:down"
alias dcl="npm run docker:logs"
alias dcp="npm run docker:ps"
alias dcb="npm run docker:build"
alias dcr="npm run docker:restart"

alias rnd-api="docker-compose logs -f api"
alias rnd-db="docker-compose exec postgres psql -U ridendine ridendine_dev"
alias rnd-redis="docker-compose exec redis redis-cli"
alias rnd-shell="docker-compose exec api sh"
```

## Documentation Links

- **Full Guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Infrastructure Report**: [INFRASTRUCTURE_WEEK1_COMPLETE.md](./INFRASTRUCTURE_WEEK1_COMPLETE.md)
- **Project Guide**: [CLAUDE.md](./CLAUDE.md)
- **Docker Compose**: [docker-compose.yml](./docker-compose.yml)

## Support

- **Issues**: Check logs first with `npm run docker:logs`
- **Health**: All services should be "healthy" after 30s
- **Rebuild**: When in doubt, rebuild: `npm run docker:build`
- **Reset**: Nuclear option: `npm run docker:clean`

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
