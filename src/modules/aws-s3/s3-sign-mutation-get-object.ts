import {
  Args,
  Resolver,
  Mutation,
  // ObjectType,
  ArgsType,
  Field,
  InputType,
  ID
} from "type-graphql";
import aws from "aws-sdk";

import { S3SignatureAction, SignedS3Payload } from "./s3-sign-mutation";
// import { inspect } from "util"; `

@InputType()
class FileInput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  uri: string;

  // @Field(() => String, { nullable: false })
  // type: string;

  // @Field()
  // lastModified: number;

  // @Field()
  // lastModifiedDate: Date;

  // @Field(() => Int, { nullable: false })
  // size: number;

  // @Field(() => String, { nullable: false })
  // name: string;

  // @Field(() => String, { nullable: false })
  // webkitRelativePath: string;

  // @Field(() => String, { nullable: false })
  // path: string;
}

@InputType()
class GetFileObjectInput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  uri: string;
}

type S3SignatureActions = "putObject" | "getObject";

@ArgsType()
class SignS3Input {
  @Field(() => [FileInput])
  files: GetFileObjectInput[];

  @Field(() => S3SignatureAction, { defaultValue: S3SignatureAction.getObject })
  action: S3SignatureActions;
}

const s3Bucket = process.env.S3_BUCKET;

@Resolver()
export class SignS3GetObject {
  @Mutation(() => SignedS3Payload)
  async signS3GetObject(
    @Args(() => SignS3Input) { action, files }: SignS3Input
  ): Promise<SignedS3Payload> {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_KEY
    };

    aws.config.update(credentials);

    const s3 = new aws.S3({
      signatureVersion: "v4",
      region: "us-west-2"
    });

    const s3Path = `files`;

    const s3Params = files.map(file => {
      let getName = file.uri.split("files/")[1];
      return {
        Bucket: s3Bucket,
        Key: `${s3Path}/${getName}`,
        Expires: 60,
        ResponseContentDisposition: `attachment; filename=${
          file.uri.split("files/")[1]
        }`
      };
    });

    const signedRequests = await Promise.all(
      s3Params.map(param => {
        let signedRequest = s3.getSignedUrl(action, param);
        const uri = `https://${s3Bucket}.s3.amazonaws.com/${param.Key}`;

        return { uri, signedRequest };
      })
    );

    // TEST GETTING A FILE
    // let getFile = s3.getObject(
    //   {
    //     Bucket: s3Params[0]?.Bucket ?? "",
    //     Key: s3Params[0].Key,

    //     ResponseContentDisposition: "attachment; filename=file.txt"
    //   },
    //   function(error, data) {
    //     if (error != null) {
    //       console.error("Failed to retrieve an object: " + error);
    //     } else {
    //       console.log("Loaded " + data.ContentLength + " bytes");
    //       console.log("VIEW DATA", inspect(data, false, 3, true));
    //       // do something with data.Body
    //     }
    //   }
    // );

    // console.log("SIGNED REQUESTS", { signedRequests });
    // console.log("GET FILE", { getFile });

    return {
      signatures: [...signedRequests]
    };
  }
}
