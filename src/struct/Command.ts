import { Command, CommandOptions } from "discord-akairo";
import { Repository, getRepository } from "typeorm";
import { Guild } from "../entity/Guild.entity";
import { Search } from "../entity/Search.entity";
import { Chat } from "../entity/Chat.entity";
import { User } from "../entity/User.entity";
import CustomClient from "./Client";
import { Report } from "../entity/Report.entity";
import { Message } from "discord.js";

class CustomCommand extends Command {
  client: CustomClient;
  guildRepository: Repository<Guild>;
  searchRepository: Repository<Search>;
  chatRepository: Repository<Chat>;
  userRepository: Repository<User>;
  reportRepository: Repository<Report>;
  user: User;

  constructor(id: string, options?: CommandOptions) {
    super(id, options);
    this.guildRepository = getRepository(Guild);
    this.searchRepository = getRepository(Search);
    this.chatRepository = getRepository(Chat);
    this.userRepository = getRepository(User);
    this.reportRepository = getRepository(Report);
  }

  async before(message: Message) {
    this.user = await this.userRepository.findOne({
      user_id: message.author.id
    });
  }
}

export default CustomCommand;
