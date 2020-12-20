import {
  Args,
  Resolver,
  Mutation,
  ObjectType,
  ArgsType,
  Field,
  InputType,
  Int,
} from "type-graphql";

import { registerEnumType } from "type-graphql";

import aws from "aws-sdk";

@InputType()
class ImageSubInput {
  @Field(() => String, { nullable: false })
  type: string;

  @Field()
  lastModified: number;

  @Field()
  lastModifiedDate: Date;

  @Field(() => Int, { nullable: false })
  size: number;

  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  webkitRelativePath: string;

  @Field(() => String, { nullable: false })
  path: string;
}

type S3SignatureActions = "putObject" | "getObject";

export enum S3SignatureAction {
  putObject = "putObject",
  getObject = "getObject",
}

registerEnumType(S3SignatureAction, {
  name: "S3SignatureAction", // this one is mandatory
  description:
    "The actions associated with obtaining a signed URL from S3 (get | put | delete)", // this one is optional
});

@ArgsType()
class SignS3Input {
  @Field(() => [ImageSubInput])
  files: ImageSubInput[];

  @Field(() => S3SignatureAction)
  action: S3SignatureActions;
}

@ObjectType()
export class SignedS3SubPayload {
  @Field(() => String)
  uri: string;

  // @Field()
  // type: string;

  // @Field()
  // lastModified: number;

  // @Field()
  // lastModifiedDate: Date;

  // @Field()
  // name: string;

  // @Field()
  // path: string;

  // @Field()
  // webkitRelativePath: string;

  // @Field()
  // size: number;

  @Field(() => String)
  signedRequest: string;
}

@ObjectType()
export class SignedS3Payload {
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
    @Args(() => SignS3Input) { action, files }: SignS3Input
  ): Promise<SignedS3Payload> {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    };

    aws.config.update(credentials);

    const s3 = new aws.S3({
      signatureVersion: "v4",
      region: "us-west-2",
    });

    const s3Path = `files`;

    const s3Params = files.map((file) => {
      const newDate = new Date();
      // if (file.type.includes("image")) {
      console.log("IS THIS HAPPENING?-1");
      return {
        Bucket: s3Bucket,
        Key: `${s3Path}/${newDate.toISOString()}-${file.name}`,
        Expires: 60,
        ContentType: file.type,
        ...file,
        // ACL: "public-read"
      };
      // }
      // console.log("IS THIS HAPPENING?-2");

      // return {
      //   Bucket: s3Bucket,
      //   Key: `${s3Path}/${newDate.toISOString()}-${file.name}`,
      //   Expires: 60,
      //   ContentType: file.type,
      //   ContentDisposition: `attachment; filename="${file.name}"`
      // };
    });

    const signedRequests = await Promise.all(
      s3Params.map((param) => {
        let signedRequest = s3.getSignedUrl(action, param);
        const uri = `https://${s3Bucket}.s3.amazonaws.com/${param.Key}`;

        // const {
        //   type,
        //   name,
        //   lastModified,
        //   lastModifiedDate,
        //   path,
        //   size,
        //   webkitRelativePath
        // } = param;

        return {
          uri,
          signedRequest,
          // type,
          // name,
          // lastModified,
          // lastModifiedDate,
          // path,
          // size,
          // webkitRelativePath
        };
      })
    );

    return {
      signatures: [...signedRequests],
    };
  }
}
