import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from "typeorm";
import { Report } from "./Report.entity";
import { Message } from "./Message.entity";

const genderEnum = ["unspecified", "female", "male"];

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  user_id: string;

  @Column("simple-json", { default: {} })
  config: { preferedGender: string; gender: string; age: number };

  @Column({ default: "unspecified", enum: genderEnum })
  gender: string;

  @Column({ default: false })
  banned: boolean;

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
