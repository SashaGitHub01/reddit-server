import DataLoader from "dataloader";
import { Updoot } from "../models/Updoot";

type PostAndUser = {
   postId: number,
   userId: number
}

export const createVoteStatusLoader = () => {
   return new DataLoader<PostAndUser, Updoot | null | undefined>(async (postAndUser) => {
      const updoots = await Updoot.findByIds(postAndUser as any)
      return postAndUser.map((ids) => updoots.find((upd) => {
         return upd.postId === ids.postId && upd.userId == ids.userId
      }))
   })
}