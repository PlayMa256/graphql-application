import * as graphqlFields from 'graphql-fields';
import { GraphQLResolveInfo } from 'graphql';
import { difference, union } from 'lodash';

export class RequestedFields {
  getFields(
    info: GraphQLResolveInfo,
    options?: { keep?: Array<string>; exclude?: Array<string> }
	): string[] {
		let fields = Object.keys(graphqlFields(info))
		if (!options) {
			return fields;
		}

		fields = (options.keep) ? union<string>(fields, options.keep) : fields;
		
		return options.exclude ? difference<string>(fields, options.exclude) : fields;
	}
}
