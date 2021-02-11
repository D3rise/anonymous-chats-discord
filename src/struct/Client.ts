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
import path from "path";
import dotenv from "dotenv";
import log4js from "log4js";
import Long from "long";
import { Chat } from "../entity/Chat.entity";
import * as config from "../config.json";
import i18n, { __ } from "i18n";
import { Search } from "../entity/Search.entity";
dotenv.config();

interface ICustomClientOptions {
  defaultPrefix: string;
  defaultLocale?: string;
  contactServerInvite?: string;
  devSite?: string;
  patreonId?: string;
}

class CustomClient extends AkairoClient {
  public logger: log4js.Logger;
  public db: Connection;
  public options: AkairoOptions & ClientOptions & ICustomClientOptions;
  public commandHandler: CommandHandler;
  public listenerHandler: ListenerHandler;
  public inhibitorHandler: InhibitorHandler;
  public startTime: Date;

  constructor(
    options?: AkairoOptions & ClientOptions & ICustomClientOptions,
    clientOptions?: ClientOptions
  ) {
    super(options, clientOptions);
    this.startTime = new Date();
    this.options = {
      ...this.options,
      ...config,
    };

    log4js.configure({
      appenders: {
        out: {
          type: "stdout",
          layout: {
            type: "pattern",
            pattern: `%[${
              process.env.NODE_ENV !== "production" ? "%d" : ""
            } [%p] Shard %x{shard}/%x{shards}:%] %m`,
            tokens: {
              shard: this.shard.ids[0] + 1,
              shards: this.shard.count,
            },
          },
        },
      },
      categories: {
        default: { appenders: ["out"], level: "debug" },
      },
    });
    this.logger = log4js.getLogger("default");
    this.logger.info(
      this.padString(` SHARD ${this.shard.ids[0] + 1} INIT STARTED `, 42, "=")
    );
    this.logger.info("Initialized logger");
    this.init();
  }

  private initI18n() {
    i18n.configure({
      directory: path.join(__dirname, "..", "..", "lang"),
      defaultLocale: process.env.LOCALE,
      locales: ["ru", "en"],
      register: global,
    });
    this.logger.info("Initialized i18n");
  }

  private async initDatabase() {
    this.db = await createConnection({
      type: "postgres",
      url: process.env.POSTGRES_URL,
      entities: [path.join(__dirname, "..", "entity", "*.entity.{ts,js}")],
      namingStrategy: new SnakeNamingStrategy(),
    });
    await this.db
      .synchronize()
      .then(() => this.logger.info("Initialized database"));
  }

  private async initIntervals() {
    setInterval(async () => {
      await this.stopTyping();
      await this.refreshStatistics();
      await this.refreshStatus();
      await this.removeExpiredSearches();
      await this.removeExpiredChats();
    }, 1000 * 10);
    this.logger.info("Initialized intervals");
  }

  private async stopTyping() {
    this.channels.cache.forEach((channel: any) => {
      if (channel.type !== "dm") return;
      channel.stopTyping(true);
    });
  }

  private async refreshStatistics() {
    if (process.env.NODE_ENV !== "dev") {
      if (config.chatsCountChannel && config.chatsCountText) {
        await this.updateChatCount();
      }

      if (config.searchCountChannel && config.searchCountText) {
        await this.updateSearchCount();
      }

      if (config.guildCountChannel && config.guildCountText) {
        await this.updateServerCount();
      }
    }
  }

  private async refreshStatus() {
    const prefix = this.options.defaultPrefix;
    const searchRepository = getRepository(Search);
    const count = await searchRepository.findAndCount({
      where: { guildId: null },
    });
    this.user.setActivity({
      name: i18n.__(
        {
          phrase: `other.botStatus`,
          locale: this.options.defaultLocale,
        },
        {
          guilds: String(this.guilds.cache.size),
          searchCount: String(count[1]),
          prefix,
        }
      ),
      type: "WATCHING",
    });
  }

  private async removeExpiredChats() {
    const chatRepository = getRepository(Chat);

    const expiredChats = await chatRepository
      .createQueryBuilder("chat")
      .where(`age(current_timestamp, last_message_date) > interval '5 minutes'`)
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
      });
    });
  }

  private async removeExpiredSearches() {
    const searchRepository = getRepository(Search);
    const expiredSearches: Search[] = await searchRepository
      .createQueryBuilder("search")
      .leftJoinAndSelect("search.user", "user")
      .where("age(current_timestamp, started_at) > interval '15 minutes'")
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
  }

  private async initHandlers() {
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
    this.logger.info("Initialized handlers");
  }

  private async init() {
    await this.initI18n();
    await this.initDatabase();
    await this.initHandlers();
    await this.initIntervals();
  }

  public static padString(str: string, length: number, char: string = " ") {
    return str.padStart((str.length + length) / 2, char).padEnd(length, char);
  }

  public padString(str: string, length: number, char: string = " ") {
    return CustomClient.padString(str, length, char);
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
    const channel: any = await this.channels.fetch(config.searchCountChannel);
    if (!channel) {
      return this.logger.error(
        `Searches count channel with id ${config.searchCountChannel} is not available`
      );
    }
    channel.setName(
      config.searchCountText.replace(/{{searchCount}}/g, String(count))
    );
  }

  public async updateChatCount() {
    const repository = getRepository(Chat);
    const count = await repository.findAndCount({ where: { endedAt: null } });
    const chatChannel: any = await this.channels.fetch(
      config.chatsCountChannel
    );

    if (!chatChannel) {
      return this.logger.error(
        `Chats count channel with id ${config.chatsCountChannel} is not available`
      );
    }

    chatChannel.setName(
      config.chatsCountText.replace(/{{chatCount}}/g, String(count[1]))
    );
  }

  public async updateServerCount() {
    const guildCount = this.guilds.cache.size;
    const guildsChannel: any = await this.channels.fetch(
      config.guildCountChannel
    );
    if (!guildsChannel) {
      return this.logger.error(
        `Guilds count channel with id ${config.guildCountChannel} is not available`
      );
    }
    guildsChannel.setName(
      config.guildCountText.replace(/{{guildCount}}/g, String(guildCount))
    );
  }

  public getDefaultChannel(guild: DiscordGuild): GuildChannel {
    // get "original" default channel
    if (guild.channels.cache.has(guild.id)) return guild.channels.cache.get(guild.id);

    // Check for a "general" channel, which is often default chat
    const generalChannel = guild.channels.cache.find(
      (channel: GuildChannel) => channel.name === "general"
    );
    if (generalChannel) return generalChannel;
    // Now we get into the heavy stuff: first channel in order where the bot can speak
    // hold on to your hats!
    return guild.channels.cache
      .filter(
        (c: GuildChannel) =>
          c.type === "text" &&
          c.permissionsFor(guild.client.user).has("SEND_MESSAGES")
      )
      .sort(
        (a: GuildChannel, b: GuildChannel) =>
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
