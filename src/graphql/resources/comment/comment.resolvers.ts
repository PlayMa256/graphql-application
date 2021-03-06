import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { ResolverContext } from "../../../interfaces/ResolverContextInterface";

export const commentResolvers = {
	Comment: {
		user: (comment, args, { db, dataLoaders: {userLoader} }: { db: DbConnection, dataLoaders: DataLoaders }, info: GraphQLResolveInfo) => {
			return userLoader
				.load({
					key: comment.get('user'),
					info
				})
				.catch(handleError);
		},
		post: (comment, args, { db, dataLoaders: { postLoader } }: { db: DbConnection, dataLoaders: DataLoaders }, info: GraphQLResolveInfo) => {
			return postLoader
				.load({
					key: comment.get('post'),
					info
				})
				.catch(handleError);
		}
	},
	Query: {
		commentsByPost: (parent, {postId, first = 10, offset = 0}, ctx: ResolverContext, info: GraphQLResolveInfo) => {
			return ctx.db.Comment.findAll({
				offset,
				where: { post: postId },
				limit: first,
				attributes: ctx.requestedFields.getFields(info)
			}).catch(handleError);
		}

	},
	Mutation: {
		createComment: compose(...authResolvers)((parent, {input},  { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => { 
			input.user = authUser.id;
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.create(input, { transaction: t });
			}).catch(handleError);
		}),
    updateComment: (parent, {id, input},  { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => { 
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.findById(id).then((comment: CommentInstance) => {
					if (!comment) {
						throw new Error(`comment ${id} not found`)
					}
					if (comment.get('user') !== authUser.id) {
						throw new Error(`can only update comments that you created`);
					}
					input.user = authUser.id;
					return comment.update(input, {
						transaction: t
					}).then((comment: CommentInstance) => {
						return !!comment;
					});
				})
			}).catch(handleError);
		},
		deleteComment: (parent, {id},  { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => { 
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.findById(id).then((comment: CommentInstance) => {
					if (!comment) {
						throw new Error(`comment ${id} not found`)
					}
					if (comment.get('user') !== authUser.id) {
						throw new Error(`can only update comments that you created`);
					}
					return comment.destroy({
						transaction: t
					}).then((comment) => {
						 // @ts-ignore
						return !!comment;
					});
				})
			}).catch(handleError);
		}
	}
}