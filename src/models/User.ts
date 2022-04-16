import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, BaseEntity, OneToMany } from "typeorm";
import { ObjectType, Field, Int } from 'type-graphql'
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity {
   @Field(() => Int)
   @PrimaryGeneratedColumn()
   id!: number;

   @Field(() => String)
   @Column({ unique: true })
   username!: string

   @Field(() => String)
   @Column({ unique: true })
   email!: string

   @Field(() => String)
   @Column()
   password!: string

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @OneToMany(() => Post, post => post.creator)
   posts: Post[]

   @OneToMany(() => Updoot, updoot => updoot.user)
   updoots: Updoot[]
}