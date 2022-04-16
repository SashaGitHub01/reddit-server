import { Post } from "./models/Post";
import { __prod__ } from "./vars";
import { MikroORM } from '@mikro-orm/core'
import path from 'path'
import { User } from "./models/User";

export default {
   migrations: {
      path: path.join(__dirname, './migrations'),
      glob: '!(*.d).{js,ts}'
   },
   entities: [Post, User],
   dbName: 'reddit',
   host: 'localhost',
   password: '123456',
   user: 'postgres',
   type: 'postgresql',
   debug: !__prod__
} as Parameters<typeof MikroORM.init>[0]