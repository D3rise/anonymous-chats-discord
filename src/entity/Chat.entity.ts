import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  getRepository,
} from "typeorm";
import { Message } from "./Message.entity";

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user1Id: string;

  @Column()
  user2Id: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  startedAt: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  endedAt: Date;

  @Column("simple-array", { default: [] })
  deanonApprovalUsers: string[];

  @Column()
  locale: string;

  @Column({ type: "timestamp with time zone", nullable: true })
  lastMessageDate: Date;

  @OneToMany((type) => Message, (message) => message.chat)
  messages: Message[];
}
