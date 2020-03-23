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
  userId: string;

  @Column("simple-json", {
    default: { gender: "none", preferedGender: "none", guild: false }
  })
  config: {
    gender: string;
    preferedGender: string;
    guild: boolean;
  };

  @Column({ default: false })
  banned: boolean;

  @Column({ enum: i18n.getLocales(), default: "ru" })
  locale: string;

  @OneToOne(type => Search, search => search.user, {
    cascade: false
  })
  currentSearch: Search;

  @OneToMany(() => Report, report => report.user)
  reports: Report[];

  @OneToMany(() => Message, message => message.authorUser)
  messages: Message[];
}
