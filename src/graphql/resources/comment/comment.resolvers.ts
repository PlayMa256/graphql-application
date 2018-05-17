import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from '../../../interfaces/DbConnectionInterface';
import { UserInstance } from "../../../models/UserModel";
import { Transaction } from "sequelize";
import { PostInstance } from "../../../models/PostModel";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError } from "../../../utils/utils";

export const commentResolvers = {
	Comment: {
		user: (comment, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.User.findById(comment.get('user')).catch(handleError);
		},
		post: (comment, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.Post.findById(comment.get('post')).catch(handleError);
		}
	},
	Query: {
		commentsByPost: (parent, {postId, first = 10, offset = 0}, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
			return db.Comment.findAll({
				offset,
				where: { post: postId },
				limit: first
			}).catch(handleError);
		}

	},
	Mutation: {
		createComment: (parent, {input}, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => { 
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.create(input, { transaction: t });
			}).catch(handleError);
		},
    updateComment: (parent, {id, input}, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => { 
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.findById(id).then((comment: CommentInstance) => {
					if (!comment) {
						throw new Error(`comment ${id} not found`)
					}
					return comment.update(input, {
						transaction: t
					}).then((comment: CommentInstance) => {
						return !!comment;
					});
				})
			}).catch(handleError);
		},
		deleteComment: (parent, {id}, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => { 
			id = parseInt(id);
			return db.sequelize.transaction((t: Transaction) => {
				return db.Comment.findById(id).then((comment: CommentInstance) => {
					if (!comment) {
						throw new Error(`comment ${id} not found`)
					}
					return comment.destroy({
						transaction: t
					}).then((comment) => {
						return !!comment;
					});
				})
			}).catch(handleError);
		}
	}
}