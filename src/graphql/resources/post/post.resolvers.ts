import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { handleError } from "../../../utils/utils";
import { authResolvers } from "../../composable/auth.resolver";
import { compose } from "../../composable/composable.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";

export const postResolvers = {
	Post: {
		author: (post, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.User.findById(post.get('author')).catch(handleError);
		},
		comments: (post, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => { 
			return db.Comment.findAll({
				where: { post: post.get('id') },
				limit: first,
				offset
			}).catch(handleError);
		}
	},
	Query: {
		posts: (parent, { first = 10, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.Post.findAll({
				limit: first,
				offset
			}).catch(handleError);
		},
		post: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			id = parseInt(id);
			return db.Post.findById(id).then((post: PostInstance) => {
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
								return post.destroy({transaction: t})
										.then(post => !!post);
				});
			}).catch(handleError);
	})
	}
}