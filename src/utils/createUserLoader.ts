import DataLoader from "dataloader";
import { User } from "../models/User";

export const createUserLoader = () => {
   return new DataLoader<number, User>(async (userIds) => {
      const users = await User.findByIds(userIds as number[])
      const userIdToUser: Record<number, User> = {}

      users.forEach(u => {
         userIdToUser[u.id] = u
      })

      return userIds.map(id => userIdToUser[id])
   })
}