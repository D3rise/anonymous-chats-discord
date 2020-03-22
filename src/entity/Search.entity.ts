import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn
} from "typeorm";
import { User } from "./User.entity";

@Entity()
export class Search {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  discord_user_id: string; // Discord ID of the user that started the search

  @Column({ type: "timestamp with time zone" })
  started_at: Date;

  @OneToOne(
    type => User,
    user => user.currentSearch,
    {
      cascade: false
    }
  )
  @JoinColumn()
  user: User;
}
