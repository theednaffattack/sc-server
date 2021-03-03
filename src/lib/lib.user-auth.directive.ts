// Adapted from: https://github.com/nmeibergen/graphql-auth-user-directives/blob/master/src/index.js
// Need a TS version.
import { IncomingMessage } from "http";
import * as jwt from "jsonwebtoken";
import { SchemaDirectiveVisitor } from "graphql-tools";
import {
  DirectiveLocation,
  GraphQLDirective,
  GraphQLField,
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
} from "graphql";
import {
  satisfiesScopes,
  satisfiesConditionalScopes,
  conditionalQueryMap,
} from "./lib.permissions";
import { TeamRoleEnum } from "../entity/Role";
import { AuthorizationError } from "./util.errors";

// export some from permissions
export { satisfiesConditionalScopes, conditionalQueryMap };

// export the defaultRole and allScopes
export const defaultRole = process.env.DEFAULT_ROLE
  ? process.env.DEFAULT_ROLE
  : "visitor";

export const allScopes = process.env.PERMISSIONS
  ? JSON.parse(Buffer.from(process.env.PERMISSIONS, "base64").toString("utf-8"))
  : null;

const authorizationHeader = process.env.AUTHORIZATION_HEADER
  ? process.env.AUTHORIZATION_HEADER
  : "authorization";

const objectIdIdentifier = process.env.OBJECT_IDENTIFIER
  ? process.env.OBJECT_IDENTIFIER.split(",").map((s) => s.trim())
  : ["id", "uid"];

const userMetaMapper = (user: any, metas: any) => {
  if (process.env.USER_METAS) {
    metas = process.env.USER_METAS.split(",");
  }

  if (user) {
    // e.g. roles
    // This can be made more generic for more custom meta data
    if (metas == null || metas.length < 1) {
      return user;
    }
    if (typeof metas === "string") {
      metas = [metas]; // Make an array
    }
    metas.forEach((meta: string) => {
      const key = Object.keys(user).find((key) =>
        key.toLowerCase().endsWith(`/${meta}`)
      );
      if (key) {
        user[meta] = user[key];
        delete user[key];
      }
    });

    return user;
  }
  return null;
};

// @ts-ignore
const getRolesAndScopes = (
  user: any,
  defaultRole: string,
  allScopes: { [key: string]: any }
) => {
  // No user provided but scopes exists
  if (user == null) {
    if (allScopes) {
      return {
        roles: defaultRole,
        scopes: allScopes[defaultRole],
      };
    } else {
      return {
        roles: defaultRole,
        scopes: null,
      };
    }
  } else {
    // case: user exists
    const roles =
      user.role || user.roles || user.Role || user.Roles || defaultRole;
    const userScopes = user.scope || user.scopes || user.Scope || user.scopes;

    if (userScopes) {
      // scopes are provided, take that as leading
      return {
        roles: null,
        scopes: userScopes,
      };
    }

    if (allScopes == null) {
      // No scopes provided at all, thus return roles only
      if (roles) {
        return {
          roles: roles,
          scopes: null,
        };
      } else {
        AuthorizationError({
          message: "No roles and scopes exists for the user.",
        });
      }
    } else {
      // case: allScopes does exists
      if (roles) {
        // a single scope is provided
        if (typeof roles === "string") {
          return {
            roles,
            scopes: allScopes[roles],
          };
        }
        // if multiple roles are provided the scopes are concatenated
        if (Array.isArray(roles)) {
          const scopesArray = roles.map((role) => allScopes[role]);
          let allScopesForUser = [].concat.apply([], scopesArray); // concatenate scopes
          // Get the unique scopes
          allScopesForUser = allScopesForUser.filter(
            (value: any, index: any, self: any) => {
              return self.indexOf(value) === index;
            }
          );
          return {
            roles,
            scopes: allScopesForUser,
          };
        }
      } else {
        AuthorizationError({
          message: "No role could be attached to the user.",
        });
      }
    }

    AuthorizationError({
      message: "No roles and scopes exists for the user.",
    });
  }
};

export const verifyAndDecodeToken = ({ context }: any) => {
  const req =
    context instanceof IncomingMessage
      ? context
      : context.req || context.request;

  if (
    !req ||
    !req.headers ||
    (!req.headers[authorizationHeader] && !req.headers[authorizationHeader]) ||
    (!req && !req.cookies && !req.cookies.token)
  ) {
    throw new AuthorizationError({ message: "No authorization token." });
  }

  const token =
    req.headers[authorizationHeader] ||
    req.headers[authorizationHeader] ||
    req.cookies.token;
  try {
    const id_token = token.replace("Bearer ", "");
    const { ACCESS_TOKEN_SECRET, JWT_NO_VERIFY } = process.env;

    let decoded = null;
    if (!ACCESS_TOKEN_SECRET && JWT_NO_VERIFY) {
      decoded = jwt.decode(id_token);
    } else {
      decoded = jwt.verify(id_token, ACCESS_TOKEN_SECRET!, {
        algorithms: ["HS256", "RS256"],
      });
    }

    return userMetaMapper(decoded, []); // finally map url metas to metas
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AuthorizationError({
        message: "Your token is expired",
      });
    } else {
      throw new AuthorizationError({
        message: "You are not authorized for this resource.",
      });
    }
  }
};

export class HasScopeDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(
    _directiveName: string,
    _schema: GraphQLSchema
  ) {
    return new GraphQLDirective({
      name: "hasScope",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
      args: {
        scopes: {
          type: new GraphQLList(GraphQLString),
          defaultValue: ["none:read"],
        },
      },
    });
  }

  // used for example, with Query and Mutation fields
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const expectedScopes: string[] = this.args.scopes;
    const next = field.resolve;

    // wrap resolver with auth check
    field.resolve = async (result, args, context, info) => {
      let authenticationError = null;
      try {
        context.user = verifyAndDecodeToken({ context });
      } catch (e) {
        authenticationError = e;
      }

      const rolesAndScopes = getRolesAndScopes(
        context.user,
        defaultRole,
        allScopes
      );
      context.user = { ...context.user, ...rolesAndScopes }; // create or extend
      const existingIds = objectIdIdentifier.filter((id) =>
        args.hasOwnProperty(id)
      );
      const objectId = existingIds.length > 0 ? args[existingIds[0]] : null;
      if (
        context.user.scopes !== null &&
        (await satisfiesScopes(
          context.driver,
          expectedScopes,
          context.user.scopes,
          context.user,
          objectId
        ))
      ) {
        return next && next(result, args, context, info);
      }

      if (context.user.roles === defaultRole && authenticationError) {
        throw authenticationError;
      }

      throw new AuthorizationError({
        message: "You are not authorized for this resource.",
      });
    };
  }

  visitObject(obj: GraphQLObjectType) {
    const fields = obj.getFields();
    const expectedScopes = this.args.scopes;

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = async (result, args, context, info) => {
        let authenticationError = null;
        try {
          context.user = verifyAndDecodeToken({ context });
        } catch (e) {
          authenticationError = e;
        }

        const rolesAndScopes = getRolesAndScopes(
          context.user,
          defaultRole,
          allScopes
        );

        context.user = { ...context.user, ...rolesAndScopes }; // create or extend
        const existingIds = objectIdIdentifier.filter((id) =>
          args.hasOwnProperty(id)
        );
        const objectId = existingIds.length > 0 ? args[existingIds[0]] : null;
        if (
          context.user.scopes !== null &&
          (await satisfiesScopes(
            context.driver,
            expectedScopes,
            context.user.scopes,
            context.user,
            objectId // take the object id to be either id or uid, providing preference to id
          ))
        ) {
          return next && next(result, args, context, info);
        }

        if (context.user.roles === defaultRole && authenticationError) {
          throw authenticationError;
        }

        throw new AuthorizationError({
          message: "You are not authorized for this resource.",
        });
      };
    });
  }
}

export class HasRoleDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(
    _directiveName: string,
    schema: GraphQLSchema
  ) {
    return new GraphQLDirective({
      name: "hasRole",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
      args: {
        roles: {
          type: new GraphQLList(schema.getType("TeamRoleEnum")!),
          defaultValue: TeamRoleEnum.PUBLIC_GUEST,
        },
      },
    });
  }

  visitFieldDefinition(field: GraphQLField<any, any>) {
    const expectedRoles: string[] = this.args.roles;
    const next = field.resolve;

    field.resolve = function (result, args, context, info) {
      let authenticationError = null;
      try {
        context.user = verifyAndDecodeToken({ context });
      } catch (e) {
        authenticationError = e;
      }

      const rolesAndScopes = getRolesAndScopes(
        context.user,
        defaultRole,
        allScopes
      );
      context.user = { ...context.user, ...rolesAndScopes }; // create or extend

      if (
        expectedRoles.some((role) => context.user.roles.indexOf(role) !== -1)
      ) {
        return next && next(result, args, context, info);
      }

      if (context.user.roles === defaultRole && authenticationError) {
        throw authenticationError;
      }

      throw new AuthorizationError({
        message: "You are not authorized for this resource.",
      });
    };
  }

  visitObject(obj: GraphQLObjectType) {
    const fields = obj.getFields();
    const expectedRoles: string[] = this.args.roles;

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = function (result, args, context, info) {
        let authenticationError = null;
        try {
          context.user = verifyAndDecodeToken({ context });
        } catch (e) {
          authenticationError = e;
        }

        const rolesAndScopes = getRolesAndScopes(
          context.user,
          defaultRole,
          allScopes
        );
        context.user = { ...context.user, ...rolesAndScopes }; // create or extend

        if (
          expectedRoles.some((role) => context.user.roles.indexOf(role) !== -1)
        ) {
          return next && next(result, args, context, info);
        }

        if (context.user.roles === defaultRole && authenticationError) {
          throw authenticationError;
        }

        throw new AuthorizationError({
          message: "You are not authorized for this resource.",
        });
      };
    });
  }
}

export class IsAuthenticatedDirective extends SchemaDirectiveVisitor {
  static getDirectiveDeclaration(
    _directiveName: string,
    _schema: GraphQLSchema
  ) {
    return new GraphQLDirective({
      name: "isAuthenticated",
      locations: [DirectiveLocation.FIELD_DEFINITION, DirectiveLocation.OBJECT],
    });
  }

  visitObject(obj: GraphQLObjectType) {
    const fields = obj.getFields();

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName];
      const next = field.resolve;

      field.resolve = function (result, args, context, info) {
        context.user = verifyAndDecodeToken({ context });

        const rolesAndScopes = getRolesAndScopes(
          context.user,
          defaultRole,
          allScopes
        );
        context.user = { ...context.user, ...rolesAndScopes }; // create or extend
        return next && next(result, args, context, info);
      };
    });
  }

  visitFieldDefinition(field: GraphQLField<any, any>) {
    const next = field.resolve;

    field.resolve = function (result, args, context, info) {
      context.user = verifyAndDecodeToken({ context });

      const rolesAndScopes = getRolesAndScopes(
        context.user,
        defaultRole,
        allScopes
      );
      context.user = { ...context.user, ...rolesAndScopes }; // create or extend

      return next && next(result, args, context, info);
    };
  }
}
