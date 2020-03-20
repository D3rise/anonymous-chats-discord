import Listener from "../struct/Listener";
import { Guild } from "../entity/Guild.entity";
import { Repository, getRepository } from "typeorm";
import { User } from "../entity/User.entity";
import { Chat } from "../entity/Chat.entity";
import { Search } from "../entity/Search.entity";
import { SDC } from "sdc-type";

class ReadyListener extends Listener {
  guildRepository: Repository<Guild>;
  userRepository: Repository<User>;
  chatRepository: Repository<Chat>;
  searchRepository: Repository<Search>;

  constructor() {
    super("ready", {
      emitter: "client",
      event: "ready"
    });

    this.guildRepository = getRepository(Guild);
    this.userRepository = getRepository(User);
    this.chatRepository = getRepository(Chat);
    this.searchRepository = getRepository(Search);
  }

  exec() {
    this.client.logger.info(
      `Successfully logged in as ${this.client.user.tag}`
    );

    this.client.guilds.forEach(guild => {
      this.guildRepository.findOne({ discord_id: guild.id }).then(async g => {
        if (!g) {
          const guildRecord = this.guildRepository.create({
            discord_id: guild.id
          });
          this.guildRepository.save(guildRecord);
          this.client.logger.debug(`Created guild record for ${guild.id}`);
        }
      });

      guild.members.each(member => {
        if (member.user.bot) return;
        this.userRepository.findOne({ user_id: member.id }).then(user => {
          if (!user) {
            const userRecord = this.userRepository.create({
              user_id: member.id
            });
            this.userRepository.save(userRecord);
          }
        });
      });
    });

    const prefix = this.client.options.defaultPrefix;
    /*
    const activities = [
      {
        name: `${this.client.guilds.size} серверов | ${prefix}help`,
        type: "WATCHING"
      },
      {
        name: `${this.client.users.size} юзеров | ${prefix}help`,
        type: "WATCHING"
      },
      {
        name: `${this.client.channels.size} каналов | ${prefix}help`,
        type: "WATCHING"
      }
    ]; 
    */

    setInterval(() => {
      this.client.user.setActivity({
        name: `${this.client.guilds.size} серверов | ${prefix}help`,
        type: "WATCHING"
      });
    }, 15000);

    // if (process.env.SDC_TOKEN) {
    //   const sdcClient = new SDC(process.env.SDC_TOKEN);
    //   sdcClient.setAutoPost(this.client.user.id, {
    //     servers: this.client.guilds.size,
    //     shards: this.client.shard.count
    //   });
    // }
  }
}

export default ReadyListener;
