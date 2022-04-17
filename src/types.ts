import express from 'express'
import { Redis } from "ioredis";
import { createUserLoader } from './utils/createUserLoader';
import { createVoteStatusLoader } from './utils/createVoteStatsLoader';

export type MyContext = {
   req: express.Request,
   res: express.Response,
   redis: Redis,
   userLoader: ReturnType<typeof createUserLoader>,
   voteStatusLoader: ReturnType<typeof createVoteStatusLoader>
}