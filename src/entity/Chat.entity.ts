import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  getRepository
} from "typeorm";
import { Message } from "./Message.entity";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user1_id: string;

  @Column() // not the relation, because relation search is slower than this
  user2_id: string;

  @Column({ default: new Date() })
  started_at: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  ended_at: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  last_message_date: Date;

  @OneToMany(
    type => Message,
    message => message.chat
  )
  messages: Message[];
}
