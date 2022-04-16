import {
   Entity, Column, BaseEntity, ManyToMany, PrimaryColumn, ManyToOne
} from "typeorm";
import { ObjectType, Field, Int } from 'type-graphql'
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
   @Field(() => Int)
   @Column({ type: 'int' })
   value: number;

   @Field()
   @PrimaryColumn()
   userId: number;

   @Field(() => User)
   @ManyToOne(() => User, (user) => user.updoots)
   user: User;

   @Field(() => Int)
   @PrimaryColumn()
   postId: number;

   @Field(() => Post)
   @ManyToOne(() => Post, (post) => post.updoots, { onDelete: 'CASCADE' })
   post: Post
}