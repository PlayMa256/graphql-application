import { DbConnection } from "./DbConnectionInterface";
import { AuthUser } from "./AuthUserInterface";
import { DataLoaders } from "./DataLoadersInterface";
import { RequestedFields } from "../graphql/ast/RequestedFields";

export interface ResolverContext {
	db?: DbConnection;
	authorization?: String;
	authUser?: AuthUser;
	dataLoaders?: DataLoaders;
	requestedFields?: RequestedFields;
}