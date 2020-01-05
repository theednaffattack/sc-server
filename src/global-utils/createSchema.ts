import { buildSchema } from "type-graphql";

import { customAuthChecker } from "../modules/utils/custom-auth-checker";

import { ChangePasswordFromContextUseridResolver } from "../modules/user/ChangePasswordFromContextUserid";
import { ChangePasswordFromTokenResolver } from "../modules/user/ChangePasswordFromToken";
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
import { UserTeamResolver } from "../modules/team/team-resolver";
import { ChannelResolver } from "../modules/channel/channel-resolver";
// import { AddMessageToChannelResolver } from "../modules/channel/add-message-to-channel";

export const createSchema = () =>
  buildSchema({
    // alphabetical please!
    resolvers: [
      // AddMessageToChannelResolver,
      ChangePasswordFromContextUseridResolver,
      ChangePasswordFromTokenResolver,
      ChannelResolver,
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
      SignS3,
      UserTeamResolver
    ],
    authChecker: customAuthChecker
    // ({ context: { req } }) => {
    //   // I can read context here
    //   // check permission vs what's in the db "roles" argument
    //   // that comes from `@Authorized`, eg,. ["ADMIN", "MODERATOR"]
    //   return !!req.session.userId;
    // }
  });
