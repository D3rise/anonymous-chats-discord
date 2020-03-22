import { Command, CommandOptions } from "discord-akairo";
import { Repository, getRepository } from "typeorm";
import { Guild } from "../entity/Guild.entity";
import { Search } from "../entity/Search.entity";
import { Chat } from "../entity/Chat.entity";
import { User } from "../entity/User.entity";
import CustomClient from "./Client";
import { Report } from "../entity/Report.entity";
import { Message } from "discord.js";
import i18n from "i18n";

class CustomCommand extends Command {
  client: CustomClient;
  guildRepository: Repository<Guild>;
  searchRepository: Repository<Search>;
  chatRepository: Repository<Chat>;
  userRepository: Repository<User>;
  reportRepository: Repository<Report>;
  user: User;
  guild: Guild;
  chat: Chat;
  userChatId: string;

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
    i18n.setLocale(this.user.locale);

    this.chat = await this.chatRepository.findOne({
      where: [
        {
          user1_id: this.user.user_id,
          ended_at: null
        },
        {
          user2_id: this.user.user_id,
          ended_at: null
        }
      ]
    });

    if (this.chat) {
      this.userChatId =
        this.chat.user1_id === message.author.id ? "user1_id" : "user2_id";
    }

    if (message.guild) {
      this.guild = await this.guildRepository.findOne({
        where: { discord_id: message.guild.id }
      });
    }
  }
}

export default CustomCommand;
