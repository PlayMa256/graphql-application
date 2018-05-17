export const tokenTypes = `
	type Token {
		token: String!
	}
`;

export const tokenMutations = `
	createToken(email: String!, password: String!): Token
`