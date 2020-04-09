import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Chat } from "./Chat.entity";
import { User } from "./User.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordAuthorId: string;

  @Column()
  discordId: string;

  @Column()
  sentId: string;

  @ManyToOne(() => User, (user) => user.messages)
  authorUser: User;

  @Column({ nullable: true })
  content: string;

  @Column("simple-array", { default: [], nullable: true })
  attachmentUris: string[];

  @Column({ type: "timestamp with time zone", nullable: true })
  createdAt: Date;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  chat: Chat;
}
