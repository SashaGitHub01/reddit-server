import { Post } from "../../models/Post";
import { Resolver, Query, Ctx, Arg, Int, Mutation, InputType, Field, UseMiddleware, FieldResolver, Root, ObjectType } from "type-graphql";
import { MyContext } from "src/types";
import { ApolloError, ForbiddenError, } from "apollo-server-express";
import { isAuth } from "../../middleware/isAuth";
import { Updoot } from "../../models/Updoot";
import { getConnection } from "typeorm";

@InputType()
class PostInput {
   @Field()
   title: string
   @Field()
   text: string
}

@ObjectType()
class PaginationPosts {
   @Field(() => [Post])
   posts: Post[]
   @Field()
   hasMore: boolean
}

@ObjectType()
class VoteRes {
   @Field(() => Number)
   newPoints: number
   @Field(() => Number, { nullable: true })
   voteStatus: number | null
}

@Resolver(Post)
export class PostResolver {
   @FieldResolver(() => String)
   textSnippet(@Root() post: Post) {
      return post.text
   }

   @FieldResolver(() => Number, { nullable: true })
   async voteStatus(
      @Root() post: Post,
      @Ctx() { req }: MyContext
   ) {
      if (!(req.session as any).userId) return null

      const status = await Updoot.findOne({
         where: {
            postId: post.id,
            userId: (req.session as any).userId,
         }
      })

      return status?.value || null
   }

   @Query(() => PaginationPosts)
   async posts(
      @Arg('limit', () => Int) limit: number,
      @Arg('offset', () => Int, { nullable: true }) offset: number
   ): Promise<PaginationPosts> {
      const skip = limit * offset - limit
      const limitPlus = limit + 1
      const posts = await Post.find({
         relations: ['creator'],
         order: {
            createdAt: 'DESC'
         },
         take: limitPlus,
         skip: skip < 0 ? 0 : skip
      });
      const hasMore = posts.length === limitPlus

      return {
         posts: posts.slice(0, limit),
         hasMore
      }
   }

   @Query(() => Post)
   async post(
      @Arg('id', () => Int) id: number
   ): Promise<Post | undefined> {
      const post = await Post.findOne(id, { relations: ['creator'] });
      return post
   }

   @Mutation(() => Post)
   @UseMiddleware(isAuth)
   async createPost(
      @Arg('input') input: PostInput,
      @Ctx() { req }: MyContext
   ): Promise<Post> {
      const newPost = await Post.create({
         ...input,
         creatorId: (req.session as any).userId,
      }).save();

      const post = await Post.findOne(newPost.id, { relations: ['creator'] })
      console.log(post)
      return post as Post
   }

   @Mutation(() => Boolean)
   @UseMiddleware(isAuth)
   async deletePost(
      @Arg('id', () => Int) id: number,
      @Ctx() { req }: MyContext
   ): Promise<boolean | void> {
      try {
         await Post.delete({ id, creatorId: (req.session as any).userId })
         return true
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => Post)
   @UseMiddleware(isAuth)
   async updatePost(
      @Arg('id', () => Int) id: number,
      @Arg('text', () => String) text: string,
      @Ctx() { req }: MyContext
   ): Promise<Post | null> {
      try {
         const post = await Post.findOne(id)
         if (!post) throw new ForbiddenError('Post doesn\'t exist')
         if (post.creatorId !== (req.session as any).userId) throw new ForbiddenError('You are not authorized')

         post.text = text
         await post.save()

         return post
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => VoteRes)
   @UseMiddleware(isAuth)
   async vote(
      @Arg('postId', () => Int) postId: number,
      @Arg('value', () => Int) value: number,
      @Ctx() { req }: MyContext
   ): Promise<VoteRes> {
      try {
         const { userId } = req.session as any
         const isUpdoot = value !== -1;
         const realValue = isUpdoot ? 1 : -1

         const post = await Post.findOne(postId);
         if (!post) throw new ForbiddenError('Post doesn\'t exist.')

         const check = await Updoot.findOne({
            where: {
               postId,
               userId,
            },
         })

         // if user has voted before 
         if (check) {
            if (check?.value === value) { // user tries to vote with the same value
               throw new ForbiddenError('You voted this post earlier')
            } else { // user change value of vote
               await getConnection()
                  .createQueryBuilder()
                  .delete()
                  .from(Updoot)
                  .where("userId = :userId", { userId })
                  .andWhere("postId = :postId", { postId })
                  .execute()
               post.points = isUpdoot ? post.points + 1 : post.points - 1; // return points to prev value
               await post.save()
            }
         }

         // never voted before
         const newUpdoot = await Updoot.create({
            userId,
            postId,
            value: realValue
         }).save()

         post.points += realValue;
         await post.save()

         return { newPoints: post.points, voteStatus: newUpdoot.value }

      } catch (err) {
         throw new ApolloError(err.message)
      }
   }
}