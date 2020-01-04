## postgres tutorial

http://www.postgresqltutorial.com/

## PSQL COMMON COMMANDS

### open psql

command: psql

### show all users

command: \du

### exit

command: \q

### show installed extensions

command: \dx

### describe functions

command: \df

### show tables

command: \dt

### create extension

**HINT: Must be superuser to create this extension.(below)**
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

### drop table

DROP TABLE [table name] CASCADE
example:
DROP TABLE product CASCADE

## LOGIN COMMANDS

psql -d [mydb] -U [myuser]
psql -h [myhost] -d [mydb] -U [myuser]
