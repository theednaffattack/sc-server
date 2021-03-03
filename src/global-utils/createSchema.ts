import { buildSchemaSync } from "type-graphql";
import { SchemaDirectiveVisitor } from "graphql-tools";
import {
  IsAuthenticatedDirective,
  HasRoleDirective,
  HasScopeDirective,
} from "../lib/lib.user-auth.directive";

import { pubsub } from "../redis";

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
  CreateProductResolver,
} from "../modules/user/CreateUser";
import { ProfilePictureResolver } from "../modules/user/ProfilePictureUpload";
import { EditUserInfoResolver } from "../modules/user/edit-user-info";
import { AdminEditUserInfoResolver } from "../modules/user/admin/admin-edit-user-info";
import { SignS3 } from "../modules/aws-s3/s3-sign-mutation";
import {
  SignS3Files,
  SignS3GetObject,
} from "../modules/aws-s3/s3-sign-mutation-get-object";

import { GetAllMessagesResolver } from "../modules/direct-messages/get-all-my-messages";
import { GetListToCreateThread } from "../modules/direct-messages/get-list-to-create-thread";
import { GetMyMessagesFromUserResolver } from "../modules/direct-messages/get-my-messages-from-user";
import { UserTeamResolver } from "../modules/team/team-resolver";
import { ChannelResolver } from "../modules/channel/channel-resolver";
import { DirectMessageResolver } from "../modules/direct-messages/direct-messages-resolver";
import { RevokeRefreshTokensForUserResolver } from "../modules/user/revoke-refresh-token";
// import { AddMessageToChannelResolver } from "../modules/channel/add-message-to-channel";

// const pubsub = new RedisPubSub();

export const createSchemaSync = () =>
  buildSchemaSync({
    authChecker: customAuthChecker,
    dateScalarMode: "isoDate",
    pubSub: pubsub,

    // alphabetical please!
    resolvers: [
      // AddMessageToChannelResolver,
      AdminEditUserInfoResolver,
      ChangePasswordFromContextUseridResolver,
      ChangePasswordFromTokenResolver,
      ChannelResolver,
      ConfirmUserResolver,
      CreateProductResolver,
      CreateUserResolver,
      DirectMessageResolver,
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
      RevokeRefreshTokensForUserResolver,
      SignS3,
      SignS3Files,
      SignS3GetObject,
      UserTeamResolver,
    ],
    // ({ context: { req } }) => {
    //   // I can read context here
    //   // check permission vs what's in the db "roles" argument
    //   // that comes from `@Authorized`, eg,. ["ADMIN", "MODERATOR"]
    //   return !!req.session.userId;
    // }
  });

// register the used directives implementations
SchemaDirectiveVisitor.visitSchemaDirectives(
  buildSchemaSync({
    authChecker: customAuthChecker,
    dateScalarMode: "isoDate",
    pubSub: pubsub,

    // alphabetical please!
    resolvers: [
      // AddMessageToChannelResolver,
      AdminEditUserInfoResolver,
      ChangePasswordFromContextUseridResolver,
      ChangePasswordFromTokenResolver,
      ChannelResolver,
      ConfirmUserResolver,
      CreateProductResolver,
      CreateUserResolver,
      DirectMessageResolver,
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
      RevokeRefreshTokensForUserResolver,
      SignS3,
      SignS3Files,
      SignS3GetObject,
      UserTeamResolver,
    ],
  }),
  {
    isAuthenticated: IsAuthenticatedDirective,
    hasRole: HasRoleDirective,
    hasScope: HasScopeDirective,
  }
);
