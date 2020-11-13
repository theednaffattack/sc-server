FROM postgres:12-alpine

# Copy in the load-extensions script
# COPY ./load-extensions.sh /docker-entrypoint-initdb.d/
COPY ./schema.sql /docker-entrypoint-initdb.d/



# Add the certs and change permissions
# COPY secret/server.crt /var/lib/postgresql/server.crt
# COPY secret/server.key /var/lib/postgresql/server.key
COPY secret/cert.pem /var/lib/postgresql/server.crt
COPY secret/key.pem /var/lib/postgresql/server.key


# RUN chown 70:70 /var/lib/postgresql/server.key && \
#     chmod 600 /var/lib/postgresql/server.key

# The owner must be postgres or root.
# Permissions are 600 for postgres and 644 for root?
RUN chmod 600 /var/lib/postgresql/server.key && \
    chown postgres:postgres /var/lib/postgresql/server.key