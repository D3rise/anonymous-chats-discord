import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Report } from "./Report.entity";
import { Message } from "./Message.entity";
import { Search } from "./Search.entity";
import i18n from "i18n";
import config from "../config.json";

const genderEnum = ["unspecified", "female", "male"];

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column("jsonb", {
    default: { gender: "none", preferredGender: "none" },
  })
  config: {
    [key: string]: any; // for IDE completion
    gender: string;
    preferredGender: string;
  };

  @Column({ default: false })
  banned: boolean;

  @Column({ enum: i18n.getLocales(), default: config.defaultLocale })
  locale: string;

  @OneToOne((type) => Search, (search) => search.user, {
    cascade: false,
  })
  currentSearch: Search;

  @OneToMany(() => Report, (report) => report.user)
  reports: Report[];

  @OneToMany(() => Message, (message) => message.authorUser)
  messages: Message[];
}
