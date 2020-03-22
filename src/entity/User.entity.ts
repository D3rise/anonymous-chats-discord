import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  OneToOne,
  JoinColumn
} from "typeorm";
import { Report } from "./Report.entity";
import { Message } from "./Message.entity";
import { Search } from "./Search.entity";

const genderEnum = ["unspecified", "female", "male"];

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  user_id: string;

  @Column("simple-json", { default: { preferedGender: "none" } })
  config: { preferedGender: string; guild: string };

  @Column({ default: "unspecified", enum: genderEnum })
  gender: string;

  @Column({ default: false })
  banned: boolean;

  @Column({ enum: ["ru", "en"], default: "ru" })
  locale: string;

  @OneToOne(
    type => Search,
    search => search.user,
    {
      cascade: false
    }
  )
  currentSearch: Search;

  @OneToMany(
    () => Report,
    report => report.user
  )
  reports: Report[];

  @OneToMany(
    () => Message,
    message => message.author_user
  )
  messages: Message[];
}
