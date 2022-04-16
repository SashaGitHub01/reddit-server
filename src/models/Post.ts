import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, BaseEntity, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { ObjectType, Field, Int } from 'type-graphql'
import { User } from "./User";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
   @Field(() => Int)
   @PrimaryGeneratedColumn()
   id!: number;

   @Field(() => String)
   @CreateDateColumn()
   createdAt: Date;

   @Field(() => String)
   @UpdateDateColumn()
   updatedAt: Date;

   @Field(() => String)
   @Column({ type: "text" })
   title!: string;

   @Field(() => String)
   @Column({ type: "text" })
   text!: string;

   @Field()
   @Column({ type: 'int', default: 0 })
   points!: number

   @Field()
   @Column()
   creatorId: number

   @Field(() => User)
   @ManyToOne(() => User, user => user.posts)
   // @JoinColumn()
   creator: User

   @OneToMany(() => Updoot, (updoot) => updoot.post)
   updoots: Updoot[]

   @Field(() => Number, { nullable: true })
   voteStatus: number | null
}