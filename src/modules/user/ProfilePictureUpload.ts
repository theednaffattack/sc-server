import {
  Resolver,
  Mutation,
  Arg,
  UseMiddleware,
  Ctx,
  InputType,
  Field,
  ID,
  ObjectType
} from "type-graphql";

import { isAuth } from "../middleware/isAuth";
import { loggerMiddleware } from "../middleware/logger";
import { MyContext } from "../../types/MyContext";
import { User } from "../../entity/User";
import { Image } from "../../entity/Image";
import { registerEnum } from "../type-graphql/register-enum";

export enum ProfileUploadStatus {
  Created = "CREATED",
  Deleted = "DELETED",
  Error = "ERROR"
}

registerEnum(
  ProfileUploadStatus,
  "ProfileUploadStatus",
  `Describes whether a profile upload has been created or deleted in the database.`
);

@InputType()
export class UploadProfilePictureInput {
  @Field(() => ID)
  user: string;

  @Field(() => String, { nullable: true })
  image: string;
}

@ObjectType()
export class UploadProfilePictueReturnType {
  @Field(() => String)
  message: string;

  @Field(() => String)
  profileImgUrl: string;
}

@Resolver()
export class ProfilePictureResolver {
  @UseMiddleware(isAuth, loggerMiddleware)
  @Mutation(() => UploadProfilePictueReturnType)
  async addProfilePicture(
    @Ctx() context: MyContext,

    @Arg("data", () => UploadProfilePictureInput)
    { image, user: userId }: UploadProfilePictureInput
  ): Promise<UploadProfilePictueReturnType> {
    if (!context) {
      throw new Error("Not authenticated");
    }

    let user = await User.findOne(userId, {
      relations: ["images"]
    });

    let newImage;
    let savedUser;

    if (user) {
      newImage = await Image.create({
        uri: `${image}`,
        user: user
      });

      user.profileImageUri = newImage.uri;

      savedUser = await user.save().catch(error => {
        throw Error(
          `Error uploading user profile image\n${JSON.stringify(
            error,
            null,
            2
          )}`
        );
      });
    }
    if (savedUser && savedUser.profileImageUri) {
      return {
        message: ProfileUploadStatus.Created,
        profileImgUrl: savedUser.profileImageUri
      };
    } else {
      throw Error("Error uploading user profile image");
    }
  }
}
