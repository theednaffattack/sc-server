# Common Docker Commands

Run locally built `Postres-12:alpine`

```bash
docker run --detach -p 5432:5432 -e POSTGRES_PASSWORD=sc_system -e POSTGRES_USER=sc_system -e POSTGRES_DB=slack_clone --name sc-db theednaffattack/sc-db:prod
```

Build and tag image

```bash
docker build -t theednaffattack/sc-server:prod .
```

Push image to dockerHub

```bash
docker push theednaffattack/sc-server
```

Combined build and push

```bash
docker build -t theednaffattack/sc-db:prod . && docker push theednaffattack/sc-db
```
