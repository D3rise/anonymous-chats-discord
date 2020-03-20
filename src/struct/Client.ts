import {
  AkairoClient,
  AkairoOptions,
  CommandHandler,
  ListenerHandler,
  InhibitorHandler
} from "discord-akairo";
import {
  ClientOptions,
  Message,
  MessageEmbedOptions,
  MessageEmbed,
  GuildChannel
} from "discord.js";
import { createConnection, Connection, getRepository } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Guild } from "../entity/Guild.entity";
import { Message as MessageEntity } from "../entity/Message.entity";
import path from "path";
import dotenv from "dotenv";
import log4js from "log4js";
import { Chat } from "../entity/Chat.entity";
import config from "../config.json";
import CustomUtil from "./Util";
dotenv.config();

interface ICustomClientOptions {
  defaultPrefix: string;
  contactServerInvite: string;
}

class CustomClient extends AkairoClient {
  options: AkairoOptions & ClientOptions & ICustomClientOptions;

  public logger: log4js.Logger;
  public db: Connection;
  public contactServerInvite: string;
  public customUtil: CustomUtil;

  public commandHandler: CommandHandler;
  private listenerHandler: ListenerHandler;
  private inhibitorHandler: InhibitorHandler;

  constructor(
    options?: AkairoOptions & ClientOptions & ICustomClientOptions,
    clientOptions?: ClientOptions
  ) {
    super(options, clientOptions);

    log4js.configure({
      appenders: {
        out: { type: "stdout" }
      },
      categories: {
        default: { appenders: ["out"], level: "debug" }
      }
    });
    this.contactServerInvite = options.contactServerInvite;

    this.logger = log4js.getLogger(
      `Shard ${this.shard.ids[0] + 1}/${this.shard.count}`
    );
    this.init();
  }

  private async init() {
    this.db = await createConnection({
      type: "postgres",
      url: process.env.POSTGRES_URL,
      entities: [path.join(__dirname, "..", "entity", "*.entity.{ts,js}")],
      namingStrategy: new SnakeNamingStrategy()
    });
    await this.db.synchronize();

    setInterval(async () => {
      const repository = getRepository(Chat);
      const expiredChats: Array<Chat> = await repository.query(
        "SELECT * FROM public.chat WHERE age(current_timestamp, last_message_date) > interval '5 minutes' AND ended_at IS NULL"
      );
      expiredChats.forEach(chat => {
        repository.findOne(chat.id).then(expiredChat => {
          expiredChat.ended_at = new Date();
          repository.save(expiredChat);
        });

        const users = [chat.user1_id, chat.user2_id];
        users.forEach(async userId => {
          const embed = this.errorEmbed(
            "Чат был окончен из-за отсутствия активности в течении 5 минут."
          );
          const user = await this.users.fetch(userId);
          user.send(embed);
        });
      });
    }, 1000 * 10);
    this.logger.info("Connected to DB");

    this.commandHandler = new CommandHandler(this, {
      directory: path.join(__dirname, "..", "commands"),
      prefix: async (message: Message) => {
        if (message.guild) {
          const guildRecord = await this.db
            .getRepository(Guild)
            .findOne({ discord_id: message.guild.id });

          return guildRecord.prefix;
        }

        return this.options.defaultPrefix;
      },
      allowMention: true
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: path.join(__dirname, "..", "events")
    });

    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: path.join(__dirname, "..", "inhibitors")
    });

    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.inhibitorHandler.loadAll();
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();

    this.customUtil = new CustomUtil(this);
  }

  public embed(data: string | MessageEmbedOptions) {
    if (typeof data === "string") {
      return new MessageEmbed().setDescription(data);
    }
    return new MessageEmbed(data);
  }

  public errorEmbed(description: string) {
    return this.embed({ description, color: "#e53935" });
  }

  public successEmbed(description: string) {
    return this.embed({ description, color: "#43a047" });
  }
}

export default CustomClient;
