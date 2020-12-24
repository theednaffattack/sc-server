# Common Docker Commands

Run locally built `Postres-12:alpine`

```bash
docker run --detach -p 5432:5432 -e POSTGRES_PASSWORD=sc_system -e POSTGRES_USER=sc_system -e POSTGRES_DB=slack_clone --name sc-db theednaffattack/sc-db:prod
```

Build and tag image

```bash
docker build -t theednaffattack/sc-server:prod .
```

Slack Clone DB (postgres - Docker container)

```bash
docker build -t theednaffattack/sc-db:init .
```

```bash
docker build -t theednaffattack/sc-db:init . && docker push theednaffattack/sc-db:init
```

Push image to dockerHub

```bash
docker push theednaffattack/sc-server:prod
```

Combined build and push

```bash
docker build -t theednaffattack/sc-server:prod . && docker push theednaffattack/sc-server:prod
```

```bash
docker build -t theednaffattack/sc-db:init . && docker push theednaffattack/sc-db:init
```
