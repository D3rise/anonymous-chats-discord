import { Listener, ListenerOptions } from "discord-akairo";
import CustomClient from "./Client";
import { Guild } from "../entity/Guild.entity";
import { Repository, getRepository } from "typeorm";
import { Search } from "../entity/Search.entity";
import { Chat } from "../entity/Chat.entity";
import { User } from "../entity/User.entity";
import { Report } from "../entity/Report.entity";
import { Message } from "../entity/Message.entity";

class CustomListener extends Listener {
  client: CustomClient;
  guildRepository: Repository<Guild>;
  searchRepository: Repository<Search>;
  messageRepository: Repository<Message>;
  chatRepository: Repository<Chat>;
  userRepository: Repository<User>;
  reportRepository: Repository<Report>;

  constructor(id: string, options?: ListenerOptions) {
    super(id, options);

    this.guildRepository = getRepository(Guild);
    this.searchRepository = getRepository(Search);
    this.messageRepository = getRepository(Message);
    this.chatRepository = getRepository(Chat);
    this.userRepository = getRepository(User);
    this.reportRepository = getRepository(Report);
  }
}

export default CustomListener;
