import { Resolver, Query, } from "type-graphql";

@Resolver()
export class HeyResolver {
   @Query(() => String)
   hello() {
      return 'hey'
   }
}