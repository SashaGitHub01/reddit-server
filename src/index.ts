import 'reflect-metadata'
import { config } from "dotenv";
config();
import { createConnection } from 'typeorm'
import express from 'express'
import cors from 'cors'
import session from "express-session"
import connectRedis from "connect-redis"
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import Redis from 'ioredis'
import { ApolloServer } from 'apollo-server-express'
import { buildSchema } from "type-graphql";
import { HeyResolver } from "./graphql/resolvers";
import { PostResolver } from "./graphql/resolvers/posts";
import { UserResolver } from "./graphql/resolvers/user";
import { SESSION_NAME, __prod__ } from "./vars";
import { Post } from "./models/Post";
import { User } from "./models/User";
import path from 'path';
import { Updoot } from './models/Updoot';
import { createUserLoader } from './utils/createUserLoader';
import { createVoteStatusLoader } from './utils/createVoteStatsLoader';

const corsOptions = {
   credentials: true,
   origin: ['https://studio.apollographql.com', 'http://localhost:3001/graphql', process.env.CLIENT as string]
}

const start = async () => {
   try {
      const PORT = 3001
      const con = await createConnection({
         database: 'reddit',
         host: 'localhost',
         password: '123456',
         username: 'postgres',
         type: 'postgres',
         synchronize: true,
         logging: true,
         entities: [Post, User, Updoot],
         migrations: [path.join(__dirname, './migrations/*')]
      })

      const app = express()
      const RedisStore = connectRedis(session)
      let redis = new Redis()

      app.set('trust proxy', 1);
      app.use(cors(corsOptions))
      app.use(cookieParser())
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));

      app.use(
         session({
            name: SESSION_NAME,
            store: new RedisStore({
               client: redis,
               disableTouch: true,
               host: 'localhost',
               port: 6379,
            }),
            saveUninitialized: false,
            secret: process.env.SECRET as string,
            resave: false,
            cookie: {
               maxAge: 1000 * 60 * 60 * 24 * 2,
               secure: __prod__ ? true : false,
               httpOnly: __prod__ ? false : true,
               sameSite: __prod__ ? 'none' : 'lax'
            }
         })
      )

      const apolloServer = new ApolloServer({
         schema: await buildSchema({
            resolvers: [HeyResolver, PostResolver, UserResolver],
            validate: false
         }),
         context: ({ req, res }) => {
            return {
               req,
               res,
               redis,
               userLoader: createUserLoader(),
               voteStatusLoader: createVoteStatusLoader()
            }
         }
      })
      await apolloServer.start()
      apolloServer.applyMiddleware({ app, cors: corsOptions })

      app.listen(PORT, () => {
         console.log('Listening', PORT)
      })
   } catch (err) {
      console.log(err)
   }
}

start()