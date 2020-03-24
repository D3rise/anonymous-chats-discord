import Listener from "../struct/Listener";
import { SDC } from "sdc-type";
import i18n from "i18n";

class ReadyListener extends Listener {
  constructor() {
    super("ready", {
      emitter: "client",
      event: "ready"
    });
  }

  exec() {
    this.client.logger.info(
      `Successfully logged in as ${this.client.user.tag}`
    );

    this.client.guilds.forEach(guild => {
      this.guildRepository
        .findOne({ discordId: guild.id })
        .then(async guildRec => {
          if (!guildRec) {
            const guildRecord = this.guildRepository.create({
              discordId: guild.id
            });
            this.guildRepository.save(guildRecord);
            this.client.logger.debug(`Created guild record for ${guild.id}`);
          }
        });

      guild.members.each(member => {
        if (member.user.bot) return;
        this.userRepository.findOne({ userId: member.id }).then(user => {
          if (!user) {
            const userRecord = this.userRepository.create({
              userId: member.id
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

    setInterval(async () => {
      const count = await this.searchRepository.count();
      this.client.user.setActivity({
        name: i18n.__(
          {
            phrase: `other.botStatus`,
            locale: this.client.options.defaultLocale
          },
          {
            guilds: String(this.client.guilds.size),
            searchCount: String(count),
            prefix
          }
        ),
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
