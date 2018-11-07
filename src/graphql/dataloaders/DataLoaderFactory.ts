import * as DataLoader from 'dataloader';
import { DbConnection } from "../../interfaces/DbConnectionInterface";
import { DataLoaders } from "../../interfaces/DataLoadersInterface";
import { UserLoader } from "./UserLoader";
import { PostLoader } from "./PostLoader";
import { UserInstance } from '../../models/UserModel';
import { PostInstance } from '../../models/PostModel';
import { RequestedFields } from '../ast/RequestedFields';
import { DataLoaderParam } from '../../interfaces/DataLoaderParamInterface';

export class DataLoaderFactory {
	constructor(
		private db: DbConnection,
		private requestedFields: RequestedFields
	) { }

	getLoaders(): DataLoaders {
		return {
			userLoader: new DataLoader<DataLoaderParam<number>, UserInstance>(
				(params: Array<DataLoaderParam<number>>) => UserLoader.batchUsers(this.db.User, params, this.requestedFields),
				{
					cacheKeyFn: (param: DataLoaderParam<number[]>) => {
						return param.key;
					}
				}
			),
			postLoader: new DataLoader<DataLoaderParam<number>, PostInstance>(
				(params: Array<DataLoaderParam<number>>) => PostLoader.batchUsers(this.db.Post, params, this.requestedFields),
				{
					cacheKeyFn: (param: DataLoaderParam<number[]>) => {
						return param.key;
					}
				}
			),
		}
	}
}