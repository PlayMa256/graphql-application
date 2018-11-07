import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { handleError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { verifyTokenResolver } from "../../composable/verifyToken.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DEFAULT_ECDH_CURVE } from "tls";
import { RequestedFields } from "../../ast/RequestedFields";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const userResolvers = {
	User: {
		posts: (user: UserInstance, { first = 10, offset = 0 }, { db, requestedFields }: { db: DbConnection, requestedFields: RequestedFields }, info: GraphQLResolveInfo) => {
			return db.Post.findAll({
				where: { author: user.get('id') },
				limit: first,
				offset: offset,
				attributes: requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
			}).catch(handleError);
		}
	},
	
	Query: {
		users: (parent, { first = 10, offset = 0 }, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			return ctx.db.User.findAll({
				limit: first,
				offset: offset,
				attributes: ctx.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
			}).catch(handleError);
		},
	
		user: (parent, { id }, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			id = parseInt(id);
			return ctx.db.User.findById(id, {
				attributes: ctx.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
			})
				.then((user: UserInstance) => {
					if (!user) {
						throw new Error(`user ${id} not found`)
					}
					return user;
				}).catch(handleError);
		},

		currentUser: compose(...authResolvers)((parent, args, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			return ctx.db.User
				.findById(ctx.authUser.id, {
					attributes: ctx.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
				})
				.then((user: UserInstance) => {
					if (!user) {
						throw new Error(`user ${ctx.authUser.id} not found`)
					}
					return user;
				}).catch(handleError);
		}),
	},
	Mutation: {
		createUser: (parent, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.sequelize.transaction((t: Transaction) => {
				return db.User
					.create(args.input, {
						transaction: t
					})
			}).catch(handleError);
		},
		updateUser: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser:AuthUser }, info: GraphQLResolveInfo) => {
			return db.sequelize.transaction((t: Transaction) => {
				return db.User.findById(authUser.id).then((user: UserInstance) => {
					if (!user) {
						throw new Error(`user ${authUser.id} not found`)
					}
					return user.update(input, {
						transaction: t
					});
				})
			}).catch(handleError);
		}),
		updateUserPassword: compose(...authResolvers)((parent, {input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
			return db.sequelize.transaction((t: Transaction) => {
				return db.User.findById(authUser.id).then((user: UserInstance) => {
					if (!user) {
						throw new Error(`user ${authUser.id} not found`)
					}
					return user.update(input, {
						transaction: t
					}).then((user: UserInstance) => {
						return !!user;
					});
				})
			}).catch(handleError);
		}),
		deleteUser: compose(...authResolvers)((parent, args, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
			return db.sequelize.transaction((t: Transaction) => {
				return db.User.findById(authUser.id).then((user: UserInstance) => {
					if (!user) {
						throw new Error(`user ${authUser.id} not found`)
					}
					return user.destroy({
						transaction: t
					}).then((user) => {
						// @ts-ignore
						return !!user;
					});
				})
			}).catch(handleError);
		})
	}
}