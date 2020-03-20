import Client from "./Client";
import config from "../config.json";
import { GuildChannel } from "discord.js";
import { Repository, getRepository } from "typeorm";
import { Chat } from "../entity/Chat.entity";
import { Message } from "../entity/Message.entity";

class CustomUtil {
  client: Client;
  chatRepository: Repository<Chat>;
  messageRepository: Repository<Message>;

  constructor(client: Client) {
    this.client = client;
    this.chatRepository = getRepository(Chat);
    this.messageRepository = getRepository(Message);
  }
}

export default CustomUtil;
