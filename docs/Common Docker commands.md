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
docker build  --shm-size 1G -t theednaffattack/sc-server:production . && docker push theednaffattack/sc-server:production
```

Dokku tag and deployment (performed from remote server)

```bash
docker pull theednaffattack/sc-server:production
```

```bash
docker tag theednaffattack/sc-server:production dokku/sc-server:latest
```

```bash
dokku tags sc-server
```

```bash
dokku tags:deploy sc-server latest
```

docker pull theednaffattack/sc-server:production && docker tag theednaffattack/sc-server:production dokku/sc-server:latest && dokku tags sc-server && dokku tags:deploy sc-server latest

```bash
docker build -t theednaffattack/sc-db:init . && docker push theednaffattack/sc-db:init
```

```bash
docker build --build-arg POSTGRES_MAJOR_VERSION=13 --build-arg POSTGIS_MAJOR=3 -t kartoza/postgis:POSTGRES_MAJOR_VERSION .
```

```bash
docker build --build-arg POSTGRES_MAJOR_VERSION=12  --build-arg POSTGIS_MAJOR=3 -t kartoza/postgis:POSTGRES_MAJOR_VERSION .
```

docker-compose -f docker-compose.db-local-dev.yml up
