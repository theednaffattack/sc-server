// from: https://gist.github.com/JeremyPlease/37112e3f035ef2e9ac3d84eac5bf0c7d
import AWS from "aws-sdk";

// load CloudFront key pair from environment variables
// Important: when storing your CloudFront private key as an environment variable string,
// you'll need to replace all line breaks with \n, like this:
// CF_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIE...1Ar\nwLW...2eL\nFOu...k2E\n-----END RSA PRIVATE KEY-----"

// const cfAccessKeyId = process.env.CF_ACCESS_KEY_ID;
const cfPublicKeyId = process.env.CF_PUBLIC_KEY_ID;
const cfPrivateKey = process.env.CF_PRIVATE_KEY;

if (cfPublicKeyId && cfPrivateKey) {
  const signer = new AWS.CloudFront.Signer(cfPublicKeyId, cfPrivateKey);

  // 2 days as milliseconds to use for link expiration
  const twoDays = 2 * 24 * 60 * 60 * 1000;

  const expireTime = Math.floor((Date.now() + twoDays) / 1000);

  const myPolicy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${process.env.CLOUDFRONT_DOMAIN}/images/*`,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": expireTime,
          },
        },
      },
    ],
  });

  // sign a CloudFront URL that expires 2 days from now
  const signedUrl = signer.getSignedUrl({
    policy: myPolicy,
    url: `https://${process.env.CLOUDFRONT_DOMAIN}/images/ghostface_a11y_1.png`,
    expires: Math.floor((Date.now() + twoDays) / 1000), // Unix UTC timestamp for now + 2 days
  });

  const defaultPolicy = JSON.stringify({
    Statement: [
      {
        Resource: `https://${process.env.CLOUDFRONT_DOMAIN}/images/*`,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": expireTime,
          },
        },
      },
    ],
  });

  const options: AWS.CloudFront.Signer.SignerOptionsWithPolicy = {
    policy: defaultPolicy,
  };

  const signedCookie = signer.getSignedCookie(options);

  console.log("\nSIGNED URL:\n", { signedCookie, signedUrl });
}
