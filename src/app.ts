import * as express from "express";
import * as graphqlHttp from "express-graphql";
import db from './models'
import schema from "./graphql/schema";
import { extractJwtMiddleware } from "./middlewares/extract-jwt.middleware";
import { DataLoaderFactory } from "./graphql/dataloaders/DataLoaderFactory";
import { RequestedFields } from "./graphql/ast/RequestedFields";

class App {
  public express: express.Application;
  private dataLoaderFactory: DataLoaderFactory;
  private requestedFields: RequestedFields;

  constructor() {
    this.express = express();
    this.init();
  }

  private init() {
    this.requestedFields = new RequestedFields();
    this.dataLoaderFactory = new DataLoaderFactory(db, this.requestedFields);
    this.middleware();
  }

  private middleware(): void {
    this.express.use(
      "/graphql",

      extractJwtMiddleware(),

      (req, res, next) => {
        req['context'] = {
          db: db,
          dataLoaders: this.dataLoaderFactory.getLoaders(),
          requestedFields: this.requestedFields
        }
        next();
      },

      graphqlHttp((req) => ({
        schema,
        graphiql: true,
        context: req['context']
      }))
    );
  }
}

export default new App().express;
