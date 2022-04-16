import { MyContext } from 'src/types'
import { MiddlewareFn, UnauthorizedError } from 'type-graphql'

export const isAuth: MiddlewareFn<MyContext> = ({ context }, next) => {
   if (!(context.req.session as any).userId) {
      throw new UnauthorizedError()
   }

   return next()
}