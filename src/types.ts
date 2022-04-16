import express from 'express'
import { Redis } from "ioredis";

export type MyContext = {
   req: express.Request,
   res: express.Response,
   redis: Redis
}