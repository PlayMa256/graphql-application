import { userQueries } from "./resources/user/user.schema";
import { commentQueries } from "./resources/comment/comment.schema";
import { postQueries } from "./resources/post/post.schema";

export const Query = `
	type Query{
		${userQueries}
		${commentQueries}
		${postQueries}
	}
`;