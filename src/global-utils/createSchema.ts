import { buildSchema } from "type-graphql";

import { ChangePasswordResolver } from "../modules/user/ChangePassword";
import { ConfirmUserResolver } from "../modules/user/ConfirmUser";
import { ForgotPasswordResolver } from "../modules/user/ForgotPassword";
import { LoginResolver } from "../modules/user/Login";
import { LogoutResolver } from "../modules/user/Logout";
import { MeResolver } from "../modules/user/Me";
import { RegisterResolver } from "../modules/user/Register";
import {
  CreateUserResolver,
  CreateProductResolver
} from "../modules/user/CreateUser";
import { ProfilePictureResolver } from "../modules/user/ProfilePictureUpload";
import { EditUserInfoResolver } from "../modules/user/edit-user-info";
import { SignS3 } from "../modules/aws-s3/s3-sign-mutation";
import { GetAllMessagesResolver } from "../modules/messages/get-all-my-messages";
import { GetListToCreateThread } from "../modules/messages/get-list-to-create-thread";
import { GetMyMessagesFromUserResolver } from "../modules/messages/get-my-messages-from-user";

export const createSchema = () =>
  buildSchema({
    // alphabetical please!
    resolvers: [
      ChangePasswordResolver,
      ConfirmUserResolver,
      CreateProductResolver,
      CreateUserResolver,
      EditUserInfoResolver,
      ForgotPasswordResolver,
      GetAllMessagesResolver,
      GetListToCreateThread,
      GetMyMessagesFromUserResolver,
      LoginResolver,
      LogoutResolver,
      MeResolver,
      ProfilePictureResolver,
      RegisterResolver,
      SignS3
    ],
    authChecker: ({ context: { req } }) => {
      // I can read context here
      // cehck permission vs what's in the db "roles" argument
      // that comes from `@Authorized`, eg,. ["ADMIN", "MODERATOR"]
      return !!req.session.userId;
    }
  });
