import { PrimaryGeneratedColumn, Column, Entity } from "typeorm";
import config from "../config.json";

@Entity()
export class Guild {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordId: string;

  @Column("jsonb", { default: { guildSearch: true } })
  config: {
    [key: string]: string | boolean; // for guild["key"] expression
    guildSearch: boolean;
  };

  @Column({ default: config.defaultPrefix })
  prefix?: string;
}
