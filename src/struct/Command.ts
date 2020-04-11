import { Command, ArgumentGenerator } from "discord-akairo";
import ArgumentOptions from "./ArgumentOptions";
import CommandOptions from "./CommandOptions";
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
  args: ArgumentOptions[];
  categoryName: string;
  user: User;
  guild: Guild;
  chat: Chat;
  userChatId: string;

  constructor(id: string, options?: CommandOptions) {
    super(id, options);
    this.args = options.args;
    this.categoryName = options.category;
    this.guildRepository = getRepository(Guild);
    this.searchRepository = getRepository(Search);
    this.chatRepository = getRepository(Chat);
    this.userRepository = getRepository(User);
    this.reportRepository = getRepository(Report);
  }

  async before(message: Message) {
    this.user = await this.userRepository.findOne({
      userId: message.author.id,
    });
    i18n.setLocale(this.user.locale);

    this.chat = await this.chatRepository.findOne({
      where: [
        {
          user1Id: this.user.userId,
          endedAt: null,
        },
        {
          user2Id: this.user.userId,
          endedAt: null,
        },
      ],
    });

    if (this.chat) {
      this.userChatId =
        this.chat.user1Id === message.author.id ? "user1Id" : "user2Id";
    }

    if (message.guild) {
      this.guild = await this.guildRepository.findOne({
        where: { discordId: message.guild.id },
      });
    }
  }
}

export default CustomCommand;
