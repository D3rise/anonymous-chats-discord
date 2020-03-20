import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Search {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  user_id: string;

  @Column({ type: "timestamp with time zone" })
  started_at: Date;
}
