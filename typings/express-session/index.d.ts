export {};

declare module "express-session" {
  interface SessionData {
    userId: string;
    teamId: string;
  }
}
