import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "./User.entity";
import { Chat } from "./Chat.entity";

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "timestamp with time zone" })
  date: Date;

  @ManyToOne(() => User, (user) => user.reports)
  user: User;

  @ManyToOne(() => Chat)
  chat: Chat;

  @Column()
  authorDiscordId: string;
}
