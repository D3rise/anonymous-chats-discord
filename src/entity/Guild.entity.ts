import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";
import config from "../config.json";

@Entity()
export class Guild {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordId: string;

  @Column({ default: config.defaultPrefix })
  prefix?: string;
}
