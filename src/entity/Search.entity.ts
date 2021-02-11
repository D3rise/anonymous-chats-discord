import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";

@Entity()
export class Search {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  discordUserId: string; // Discord ID of the user that started the search

  @Column({ type: "timestamp with time zone" })
  startedAt: Date;

  @Column({ nullable: true })
  guildId: string;

  @OneToOne((type) => User, (user) => user.currentSearch, {
    cascade: false,
  })
  @JoinColumn()
  user: User;
}
