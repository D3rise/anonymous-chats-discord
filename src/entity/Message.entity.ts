import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Chat } from "./Chat.entity";
import { User } from "./User.entity";

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discord_author_id: string;

  @Column()
  discord_id: string;

  @Column()
  sent_id: string;

  @ManyToOne(
    () => User,
    user => user.messages
  )
  author_user: User;

  @Column({ nullable: true })
  content: string;

  @Column("simple-array", { default: [] })
  attachmentUris: string[];

  @Column({ default: new Date() })
  created_at: Date;

  @ManyToOne(
    () => Chat,
    chat => chat.messages
  )
  chat: Chat;
}
