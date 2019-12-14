import {
  Args,
  Resolver,
  Mutation,
  ObjectType,
  ArgsType,
  Field,
  InputType
} from "type-graphql";
import aws from "aws-sdk";

@InputType()
class ImageSubInput {
  @Field(() => String, { nullable: false })
  filename: string;

  @Field(() => String, { nullable: false })
  filetype: string;
}

@ArgsType()
class SignS3Input {
  @Field(() => [ImageSubInput])
  files: ImageSubInput[];
}

@ObjectType()
class SignedS3SubPayload {
  @Field(() => String)
  url: string;

  @Field(() => String)
  signedRequest: string;
}

@ObjectType()
class SignedS3Payload {
  @Field(() => [SignedS3SubPayload])
  signatures: SignedS3SubPayload[];
}

// const USER_ADDED = "USER_ADDED";
const s3Bucket = process.env.S3_BUCKET;

// const formatErrors = (e, models) => {
//   if (e instanceof models.sequelize.ValidationError) {
//     return e.errors.map(x => _.pick(x, ["path", "message"]));
//   }
//   return [{ path: "name", message: "something went wrong" }];
// };

@Resolver()
export class SignS3 {
  @Mutation(() => SignedS3Payload)
  async signS3(
    @Args(() => SignS3Input) input: SignS3Input
  ): Promise<SignedS3Payload> {
    // @ts-ignore
    // const { filename, filetype } = input;

    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY
    };

    aws.config.update(credentials);

    const s3 = new aws.S3({
      signatureVersion: "v4",
      region: "us-west-2"
    });

    const s3Path = `images`;

    const s3Params = input.files.map((file: any) => {
      return {
        Bucket: s3Bucket,
        Key: `${s3Path}/${file.filename}`,
        Expires: 60,
        ContentType: file.filetype
        // ACL: "public-read"
      };
    });

    const signedRequests = await Promise.all(
      s3Params.map(param => {
        let signedRequest = s3.getSignedUrl("putObject", param);
        const url = `https://${s3Bucket}.s3.amazonaws.com/${param.Key}`;

        return { url, signedRequest };
      })
    );

    return {
      signatures: [...signedRequests]
    };
  }
}
