import {
  Args,
  Resolver,
  Mutation,
  // ObjectType,
  ArgsType,
  Field,
  InputType,
  ID,
  Int,
} from "type-graphql";
import AWS from "aws-sdk";

import { S3SignatureAction, SignedS3Payload } from "./s3-sign-mutation";
// import { inspect } from "util"; `

@InputType()
class FileInput {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  uri: string;
}

@InputType()
class FileInput_v2 {
  @Field(() => String, { nullable: false })
  type: string;

  @Field()
  lastModified: number;

  @Field(() => String)
  lastModifiedDate: string;

  @Field(() => Int, { nullable: false })
  size: number;

  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  webkitRelativePath: string;

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

@ArgsType()
class SignS3Input_v2 {
  @Field(() => [FileInput_v2])
  files: FileInput_v2[];

  @Field(() => S3SignatureAction)
  action: S3SignatureActions;
}

@Resolver()
export class SignS3Files {
  @Mutation(() => SignedS3Payload)
  async signS3Files(
    @Args(() => SignS3Input_v2) { action, files }: SignS3Input_v2
  ): Promise<SignedS3Payload> {
    console.log("VIEW ACTION AND FILES SUBMITTED", { action, files });

    const s3Bucket = process.env.S3_BUCKET;
    const credentials = {
      accessKeyId: process.env.SC_ADMIN_ACCESS_KEY_ID,
      secretAccessKey: process.env.SC_ADMIN_SECRET_ACCESS_KEY,
    };

    AWS.config.update(credentials);

    const s3 = new AWS.S3({
      signatureVersion: "v4",
      region: "us-west-1",
    });

    // const s3Path = `images`;

    const s3Params = files.map((file) => {
      return {
        Bucket: s3Bucket,
        Key: file.name,
        Expires: 60,
      };
    });

    // Map over all the files and sign an individual
    // request for each file. This will result in a link
    // that can be used to upload directly from the client to
    // file storage.
    return {
      signatures: await Promise.all(
        s3Params.map((param) => {
          let signedRequest = s3.getSignedUrl(action, param);
          const uri = `https://${s3Bucket}.s3.amazonAWS.com/${param.Key}`;

          return { uri, signedRequest };
        })
      ),
    };
  }
}

@Resolver()
export class SignS3GetObject {
  @Mutation(() => SignedS3Payload)
  async signS3GetObject(
    @Args(() => SignS3Input) { action, files }: SignS3Input
  ): Promise<SignedS3Payload> {
    const s3Bucket = process.env.S3_BUCKET;
    const credentials = {
      accessKeyId: process.env.SC_ADMIN_ACCESS_KEY_ID,
      secretAccessKey: process.env.SC_ADMIN_SECRET_ACCESS_KEY,
    };

    AWS.config.update(credentials);

    const s3 = new AWS.S3({
      signatureVersion: "v4",
      region: "us-west-2",
    });

    const s3Path = `files`;

    const s3Params = files.map((file) => {
      let getName = file.uri.split("files/")[1];
      return {
        Bucket: s3Bucket,
        Key: `${s3Path}/${getName}`,
        Expires: 60,
        ResponseContentDisposition: `attachment; filename=${
          file.uri.split("files/")[1]
        }`,
      };
    });

    const signedRequests = await Promise.all(
      s3Params.map((param) => {
        let signedRequest = s3.getSignedUrl(action, param);
        const uri = `https://${s3Bucket}.s3.amazonAWS.com/${param.Key}`;

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
      signatures: [...signedRequests],
    };
  }
}
