import { AWSError, Credentials } from "aws-sdk";
import ACM from "aws-sdk/clients/acm";
import path from "path";
import fs from "fs";
import { CredentialsOptions } from "aws-sdk/lib/credentials";

let credentials: Credentials | CredentialsOptions | null | undefined;

if (
  process.env.SC_ADMIN_ACCESS_KEY_ID &&
  process.env.SC_ADMIN_SECRET_ACCESS_KEY
) {
  credentials = {
    accessKeyId: process.env.SC_ADMIN_ACCESS_KEY_ID,
    secretAccessKey: process.env.SC_ADMIN_SECRET_ACCESS_KEY,
  };
}
const clientManager = new ACM({
  apiVersion: "2015-12-08",
  credentials,
  region: "us-east-1",
});

clientManager.importCertificate(
  {
    Certificate: fs.readFileSync(
      path.resolve(__dirname, `../../secret/cert.pem`)
    ),
    PrivateKey: fs.readFileSync(
      path.resolve(__dirname, `../../secret/key.pem`)
    ),
    CertificateArn:
      "arn:aws:acm:us-east-1:942394920512:certificate/29d4eafd-1014-4d2a-a506-8466588fbde4",
    CertificateChain: fs.readFileSync(
      path.resolve(__dirname, `../../secret/fullchain.pem`)
    ),
    Tags: [{ Key: "operation", Value: "test" }],
  },
  importCertCallback
);

function importCertCallback(
  error: AWSError,
  data: ACM.ImportCertificateResponse
): void {
  if (error) {
    console.warn("VIEW ACM IMPORT CERT ERROR", error);
  }
  if (data.CertificateArn) {
    console.log("CERTIFICATE SUCCESSFULLY RE-UPLOADED", data);
  }
}
