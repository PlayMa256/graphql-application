import * as express from "express";
import * as graphqlHttp from "express-graphql";
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cors from 'cors';
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
    this.express.use(compression());
    this.express.use(helmet());
    this.express.use(cors({
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Encoding'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));
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
