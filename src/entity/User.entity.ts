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

  @Column({ default: false })
  premium: boolean;

  @Column({ default: "unspecified", enum: genderEnum })
  prefer_gender: string;

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
