import {
  ACMClient,
  ACMClientConfig,
  DescribeCertificateCommand,
  DescribeCertificateCommandOutput,
  ListCertificatesCommand,
  ListCertificatesCommandOutput,
} from "@aws-sdk/client-acm";
import { CredentialsOptions } from "aws-sdk/lib/credentials";

const noResultsMessage = "No results, the Certificate List may be empty.";

async function ListCerts(): Promise<
  | DescribeCertificateCommandOutput[]
  | "No results, the Certificate List may be empty."
> {
  let credentials: CredentialsOptions | undefined;
  if (
    process.env.SC_ADMIN_ACCESS_KEY_ID === undefined ||
    process.env.SC_ADMIN_SECRET_ACCESS_KEY === undefined
  ) {
    throw new Error(
      "Error!\n One or both of environment variables: 'SC_ADMIN_ACCESS_KEY_ID' or 'SC_ADMIN_ACCESS_KEY_ID' is undefined. Please set these environment variables and re-run this script."
    );
  } else {
    credentials = {
      accessKeyId: process.env.SC_ADMIN_ACCESS_KEY_ID,
      secretAccessKey: process.env.SC_ADMIN_SECRET_ACCESS_KEY,
    };

    const clientConfig: ACMClientConfig = {
      apiVersion: "2015-12-08",
      credentials,
      region: "us-east-1",
    };

    const listCommand = new ListCertificatesCommand({});

    const client = new ACMClient(clientConfig);

    let certList: ListCertificatesCommandOutput | undefined;

    try {
      certList = await client.send(listCommand);
    } catch (error) {
      console.warn("ERROR FETCHING CERTIFICATE LIST.\n", error);
    }

    if (certList?.CertificateSummaryList) {
      try {
        return await Promise.all(
          certList.CertificateSummaryList.map(async ({ CertificateArn }) => {
            const describeCommand = new DescribeCertificateCommand({
              CertificateArn,
            });
            return await client.send(describeCommand);
          })
        );
      } catch (describeError) {
        console.warn(
          "ERROR FETCHING CERTIFICATE DESCRIPTION.\n",
          describeError
        );
      }
    }

    return noResultsMessage;
  }
}

ListCerts()
  .then((data) => console.log("VIEW DATA", data))
  .catch((error) => console.warn("ERROR (ListCerts)! ", error))
  .finally(() => console.log("LIST CERTS FUNCTION COMPLETE"));
