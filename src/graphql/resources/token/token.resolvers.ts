import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { UserInstance } from "../../../models/UserModel";
import { handleError, JWT_SECRET } from "../../../utils/utils";
import * as jwt from 'jsonwebtoken';

export const tokenResolvers = {
	Mutation: {
		createToken: (parent, {email, password}, {db}: {db: DbConnection}) => {
			return db.User.findOne({
				where: {
					email: email
				},
				attributes: ['id', 'password']
			}).then((user: UserInstance) => {
				if (!user) {
					throw new Error(`user not found, email ${email} is not present`);
				}
				if (!user.isPassword(user.get('password'), password)) {
					throw new Error(`Wrong password!!!`);
				}
				const payload = {
					sub: user.get('id')
				}
				return {
					token: jwt.sign(payload, JWT_SECRET)
				}
			}).catch(handleError);
		}
	}

};