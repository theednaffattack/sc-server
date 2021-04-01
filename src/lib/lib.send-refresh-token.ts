import { Response } from "express";
import internalIp from "internal-ip";

export const sendRefreshToken = (res: Response, token: string) => {
  const homeIp = internalIp.v4.sync();
  res.cookie(process.env.COOKIE_NAME!, token, {
    domain:
      process.env.NODE_ENV === "production"
        ? process.env.COOKIE_DOMAIN
        : `${homeIp}`,

    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days,
    secure: process.env.NODE_ENV === "production" ? true : false,
    httpOnly: true,
    // path: "/",
    // path: "/refresh_token",
  });
  console.log("REFRESH TOKEN SENT", { token });
};
