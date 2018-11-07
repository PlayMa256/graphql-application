import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { handleError } from "../../../utils/utils";
import { authResolvers } from "../../composable/auth.resolver";
import { compose } from "../../composable/composable.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const postResolvers = {
	Post: {
		author: (post, args, { db, dataLoaders: { userLoader } }: { db: DbConnection, dataLoaders: DataLoaders }, info: GraphQLResolveInfo) => {
			return userLoader
				.load({
					key: post.get('author'),
					info
				})
				.catch(handleError);
		},
		comments: (post, { first = 10, offset = 0 }, ctx: ResolverContext, info: GraphQLResolveInfo) => { 
			return ctx.db.Comment.findAll({
				where: { post: post.get('id') },
				limit: first,
				offset,
				attributes: ctx.requestedFields.getFields(info)
			}).catch(handleError);
		}
	},
	Query: {
		posts: (parent, { first = 10, offset = 0 }, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			return ctx.db.Post.findAll({
				limit: first,
				offset,
				attributes: ctx.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
			}).catch(handleError);
		},
		post: (parent, { id }, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			id = parseInt(id);
			return ctx.db.Post.findById(id, {
				attributes: ctx.requestedFields.getFields(info, {keep: ['id'], exclude: ['comments']})
			}).then((post: PostInstance) => {
				if (!post) {
					throw new Error(`post with id ${id} not found`);
				}
				return post;
			}).catch(handleError);
		},
	},
	Mutation: {
		createPost: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
			input.author = authUser.id;
			return db.sequelize.transaction((t: Transaction) => {
				return db.Post
					.create(input, {
						transaction: t
					})
			}).catch(handleError);
		}),

		updatePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => { 
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Post.findById(id).then((post: PostInstance) => {
					if (!post) {
						throw new Error(`post ${id} not found`)
					}
					if (post.get('author') !== authUser.id) {
						throw new Error(`post cant be edited by the current user, you can only update your own posts`)
					}
					input.author = authUser.id;
					return post.update(input, {
						transaction: t
					});
				})
			}).catch(handleError);
		}),
		deletePost: compose(...authResolvers)((parent, { id }, {db, authUser}: {db: DbConnection, authUser: AuthUser}, info: GraphQLResolveInfo) => {
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Post
						.findById(id)
					.then((post: PostInstance) => {
						if (!post) {
								throw new Error(`Post with id ${id} not found!`)
						}
						if (post.get('author') !== authUser.id) {
							throw new Error(`Unauthorized! You can only delete posts by yourself!`)
						}
						return post.destroy({ transaction: t })
									// @ts-ignore
										.then(post => !!post);
				});
			}).catch(handleError);
	})
	}
}