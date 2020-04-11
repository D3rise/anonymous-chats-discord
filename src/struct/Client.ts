import {
  AkairoClient,
  AkairoOptions,
  CommandHandler,
  ListenerHandler,
  InhibitorHandler,
} from "discord-akairo";
import {
  ClientOptions,
  Message,
  MessageEmbedOptions,
  MessageEmbed,
  Guild as DiscordGuild,
  GuildChannel,
  DiscordAPIError,
} from "discord.js";
import { createConnection, Connection, getRepository } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { Guild } from "../entity/Guild.entity";
import { Message as MessageEntity } from "../entity/Message.entity";
import path from "path";
import dotenv from "dotenv";
import log4js from "log4js";
import DBL from "dblapi.js";
import Long from "long";
import { Chat } from "../entity/Chat.entity";
import * as config from "../config.json";
import i18n, { __ } from "i18n";
import { Search } from "../entity/Search.entity";
import { User } from "../entity/User.entity";
dotenv.config();

interface ICustomClientOptions {
  defaultPrefix: string;
  defaultLocale?: string;
  contactServerInvite?: string;
  devSite?: string;
  patreonId?: string;
}

class CustomClient extends AkairoClient {
  options: AkairoOptions & ClientOptions & ICustomClientOptions;

  public logger: log4js.Logger;
  public db: Connection;
  public contactServerInvite: string;

  public commandHandler: CommandHandler;
  private listenerHandler: ListenerHandler;
  private inhibitorHandler: InhibitorHandler;
  private dbl: DBL;

  constructor(
    options?: AkairoOptions & ClientOptions & ICustomClientOptions,
    clientOptions?: ClientOptions
  ) {
    super(options, clientOptions);
    this.options.defaultLocale = config.defaultLocale;
    this.options.devSite = config.devSite;
    this.options.patreonId = config.patreonId;
    this.options.contactServerInvite = config.contactServerInvite;

    log4js.configure({
      appenders: {
        out: { type: "stdout" },
      },
      categories: {
        default: { appenders: ["out"], level: "debug" },
      },
    });

    i18n.configure({
      directory: path.join(__dirname, "..", "..", "lang"),
      defaultLocale: process.env.LOCALE,
      locales: ["ru", "en"],
      register: global,
    });

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
      namingStrategy: new SnakeNamingStrategy(),
    });
    await this.db.synchronize();

    if (process.env.DBL_TOKEN) {
      this.dbl = new DBL(process.env.DBL_TOKEN, this);
      this.dbl.on("error", (error) => {
        this.logger.error(`Error while connecting to DBL:\n${error}`);
      });
      this.dbl.on("posted", () => {
        this.logger.info("Successfully posted stats to DBL");
      });
    }

    setInterval(async () => {
      const chatRepository = getRepository(Chat);

      const expiredChats = await chatRepository
        .createQueryBuilder("chat")
        .where(
          `age(current_timestamp, last_message_date) > interval '5 minutes'`
        )
        .andWhere(`ended_at IS NULL`)
        .orWhere(`age(current_timestamp, started_at) > interval '5 minutes'`)
        .andWhere(`last_message_date IS NULL`)
        .andWhere(`ended_at IS NULL`)
        .getMany();

      expiredChats.forEach((chat) => {
        chatRepository.findOne(chat.id).then((expiredChat) => {
          expiredChat.endedAt = new Date();
          chatRepository.save(expiredChat);
        });

        const users = [chat.user1Id, chat.user2Id];
        users.forEach(async (userId) => {
          const embed = this.errorEmbed(
            __({ phrase: "errors.chatTimeout", locale: chat.locale })
          );
          const user = await this.users.fetch(userId);
          user.send(embed).catch((e: DiscordAPIError) => {
            if (e.message === "Cannot send messages to this user")
              return this.logger.error(`Cannot send messages to ${userId}`);
          });
          // some very secret code...
          /*
          const userRecord = await userRepository.findOne({
            relations: ["message"],
            where: { userId },
          });
          const userMessagesInChat = userRecord.messages.filter(
            (message) => message.chat === chat
          );
          if (userMessagesInChat.length === 0) {
            userRecord.notActiveCount += 1;

            if (userRecord.notActiveCount > 7) {
              userRecord.banned = true;
              user
                .send(
                  this.errorEmbed(
                    i18n.__(
                      {
                        phrase:
                          "errors.youBannedWeThinkYouAreNotSendingMessages",
                        locale: userRecord.locale,
                      },
                      {
                        serverInvite: `https://discord.gg/${this.options.contactServerInvite}`,
                      }
                    )
                  )
                )
                .catch((e: DiscordAPIError) => {
                  if (e.message === "Cannot send messages to this user")
                    return this.logger.error(
                      `Cannot send messages to ${userId}`
                    );
                });
            }
          }
          */
        });
      });

      const searchRepository = getRepository(Search);
      const expiredSearches: Search[] = await searchRepository
        .createQueryBuilder("search")
        .leftJoinAndSelect("search.user", "user")
        .where("age(current_timestamp, started_at) > interval '5 minutes'")
        .getMany();

      expiredSearches.forEach(async (expiredSearch) => {
        await searchRepository.delete(expiredSearch);
        const searcher = await this.users.fetch(expiredSearch.discordUserId);
        const embed = this.errorEmbed(
          __({
            phrase: "errors.searchTimeout",
            locale: expiredSearch.user.locale,
          })
        );

        searcher.send(embed);
      });

      if (process.env.NODE_ENV !== "dev") {
        await this.updateChatCount();
        await this.updateSearchCount();
      }

      this.channels.forEach((channel: any) => {
        if (channel.type !== "dm") return;
        channel.stopTyping(true);
      });
    }, 1000 * 10);
    this.logger.info("Connected to DB");

    this.commandHandler = await new CommandHandler(this, {
      directory: path.join(__dirname, "..", "commands"),
      prefix: async (message: Message) => {
        if (message.guild) {
          const guildRecord = await this.db
            .getRepository(Guild)
            .findOne({ discordId: message.guild.id });
          if (!guildRecord) return this.options.defaultPrefix;

          return guildRecord.prefix;
        }

        return this.options.defaultPrefix;
      },
      allowMention: true,
    });

    this.listenerHandler = new ListenerHandler(this, {
      directory: path.join(__dirname, "..", "events"),
    });

    this.inhibitorHandler = new InhibitorHandler(this, {
      directory: path.join(__dirname, "..", "inhibitors"),
    });

    this.commandHandler.useListenerHandler(this.listenerHandler);
    this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
    this.inhibitorHandler.loadAll();
    this.listenerHandler.loadAll();
    this.commandHandler.loadAll();
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

  public async updateSearchCount() {
    const repository = getRepository(Search);
    const count = await repository.count();
    const channel: any = await this.channels.fetch(config.searchCountChannelId);
    channel.setName(config.searchCountText + count);
  }

  public async updateChatCount() {
    const repository = getRepository(Chat);
    const count = await repository.findAndCount({ where: { endedAt: null } });
    const chatChannel: any = await this.channels.fetch(
      config.chatsCountChannelId
    );
    chatChannel.setName(config.chatsCountText + count[1]);

    const countOfInterlocutors = count[1] * 2; // 1 chat contains 2 interlocutors
    const interlocutorsChannel: any = await this.channels.fetch(
      config.interlocutorsChannelId
    );
    interlocutorsChannel.setName(
      config.interlocutorsChannelText + countOfInterlocutors
    );
  }

  public getDefaultChannel(guild: DiscordGuild): GuildChannel {
    // get "original" default channel
    if (guild.channels.has(guild.id)) return guild.channels.get(guild.id);

    // Check for a "general" channel, which is often default chat
    const generalChannel = guild.channels.find(
      (channel) => channel.name === "general"
    );
    if (generalChannel) return generalChannel;
    // Now we get into the heavy stuff: first channel in order where the bot can speak
    // hold on to your hats!
    return guild.channels
      .filter(
        (c) =>
          c.type === "text" &&
          c.permissionsFor(guild.client.user).has("SEND_MESSAGES")
      )
      .sort(
        (a, b) =>
          a.position - b.position ||
          Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber()
      )
      .first();
  }

  public humanizeSetting(value: string | boolean) {
    switch (value) {
      case "male":
        return "other.maleGender";
      case "female":
        return "other.femaleGender";
      case "none":
        return "other.noneGender";
      case true:
        return "other.yes";
      case false:
        return "other.no";
    }
  }
}

export default CustomClient;
