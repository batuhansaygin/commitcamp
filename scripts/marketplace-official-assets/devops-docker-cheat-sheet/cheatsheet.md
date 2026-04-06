# DevOps & Docker Cheat Sheet — CommitCamp Official

## Docker CLI

```bash
docker build -t myapp:1 .
docker run --rm -p 3000:3000 myapp:1
docker ps -a
docker logs -f <container>
docker exec -it <container> sh
```

## Dockerfile tips

- Use multi-stage builds: deps → build → minimal runtime image.
- Pin base image digests in production Dockerfiles.
- `USER nonroot` before `CMD`.

## Compose

```bash
docker compose up -d
docker compose logs -f service_name
docker compose down -v
```

## Debugging

```bash
docker inspect <container>
docker stats
```

## CI/CD (conceptual)

- Lint + test on every PR.
- Build image on main; tag with git SHA.
- Deploy with health checks and automatic rollback.

---

*CommitCamp marketplace — official digital product.*
