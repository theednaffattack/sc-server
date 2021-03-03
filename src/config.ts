const env = process.env.NODE_ENV; // 'dev' or 'test'

const dev = {
  app: {
    port: process.env.VIRTUAL_PORT,
  },
  db: {
    host: "10.0.0.188",
    port: 27017,
    name: "db",
  },
};

const prod = {
  app: {
    port: 5050,
  },
  db: {
    host: "10.0.0.188",
    port: 27017,
    name: "db",
  },
};

const test = {
  app: {
    port: 5050,
  },
  db: {
    host: "10.0.0.188",
    port: 27017,
    name: "test",
  },
};

const config = {
  dev,
  prod,
  test,
};

export default config[env];
