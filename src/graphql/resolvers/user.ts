import { User } from "../../models/User";
import bcrypt from 'bcryptjs'
import { Resolver, Query, Ctx, Arg, Int, Mutation, InputType, Field, UnauthorizedError } from "type-graphql";
import { MyContext } from "src/types";
import { ApolloError, ForbiddenError, UserInputError } from "apollo-server-express";
import { SESSION_NAME } from "../../vars";
import isEmail from 'isemail'
import { sendMail } from "../../utils/sendMail";
import jwt from 'jsonwebtoken'
import { getConnection } from "typeorm";

@InputType()
class RegInput {
   @Field()
   username: string
   @Field()
   password: string
   @Field()
   email: string
}

@InputType()
class LoginInput {
   @Field()
   password: string
   @Field()
   emailOrUsername: string
}

@Resolver()
export class UserResolver {
   @Query(() => User, { nullable: true })
   async me(
      @Ctx() { req }: MyContext
   ): Promise<User | null> {
      try {
         const userId = (req.session as any)?.userId;
         if (!userId) throw new UnauthorizedError()

         const user = await User.findOne(userId)
         if (!user) throw new UnauthorizedError()

         return user;
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Query(() => [User], { nullable: true })
   async users(
   ): Promise<User[] | null> {
      try {
         const users = await User.find({})
         return users;
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => User)
   async registration(
      @Arg('input') input: RegInput,
      @Ctx() { req }: MyContext
   ): Promise<User | null> {
      try {
         if (input.username.length < 2) throw new UserInputError('Short username')
         if (input.password.length < 5) throw new UserInputError('Short password')

         if (!isEmail.validate(input.email)) throw new UserInputError('Invalid email')

         const check = await User.findOne({ where: { username: input.username } })
         const checkEmail = await User.findOne({ where: { email: input.email } })

         if (check || checkEmail) throw new ForbiddenError('User already exists')

         const hash = await bcrypt.hash(input.password, 4)
         const user = await getConnection()
            .createQueryBuilder()
            .insert()
            .into(User)
            .values({
               email: input.email,
               username: input.username,
               password: hash,
            })
            .returning('*')
            .execute();

         (req.session as any).userId = user.raw[0].id

         return user.raw[0];
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => User)
   async login(
      @Arg('input') input: LoginInput,
      @Ctx() { req }: MyContext
   ): Promise<User | null> {
      try {
         const email = isEmail.validate(input.emailOrUsername)
         const check = await User.findOne(
            email
               ? { where: { email: input.emailOrUsername } }
               : { where: { username: input.emailOrUsername } }
         )

         if (!check) throw new UserInputError('User doesn\'t exist')

         const verify = await bcrypt.compare(input.password, check.password)
         if (!verify) throw new UserInputError('Invalid password');
         (req.session as any).userId = check.id

         return check;
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => Boolean)
   async logout(
      @Ctx() { req, res }: MyContext
   ): Promise<boolean> {
      try {
         res.clearCookie(SESSION_NAME);
         req.session.destroy((err) => {
            if (err) {
               console.log(err)
            }
         })
         return true
      } catch (err) {
         return false
      }
   }

   @Mutation(() => Boolean)
   async forgotPassword(
      @Ctx() { redis }: MyContext,
      @Arg('email') email: string
   ): Promise<boolean> {
      try {
         const user = await User.findOne({ where: { email } });
         if (!user) throw new UserInputError('User not found')

         const secret = jwt.sign({ id: user.id }, process.env.SECRET as string, { expiresIn: '1d' })
         redis.set(secret, user.id, 'ex', 1000 * 60 * 60 * 24)
         sendMail(email, secret)

         return true
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }

   @Mutation(() => User)
   async changePassword(
      @Ctx() { redis }: MyContext,
      @Arg('newPassword') newPassword: string,
      @Arg('secret') secret: string
   ): Promise<User> {
      try {
         const id = await redis.get(secret)
         if (!id) throw new ForbiddenError('Token expired')

         const user = await User.findOne(+id);
         if (!user) throw new UserInputError('User not found')

         user.password = await bcrypt.hash(newPassword, 5)
         await user.save()
         redis.del(secret)
         return user
      } catch (err) {
         throw new ApolloError(err.message)
      }
   }
}