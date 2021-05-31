import Listener from "../struct/Listener";
import { getLogger } from "log4js";

class ReadyListener extends Listener {
  constructor() {
    super("ready", {
      emitter: "client",
      event: "ready",
    });
  }

  async exec() {
    const shardId = this.client.shard.ids[0] + 1;
    this.client.logger.info(
      `Successfully logged in as ${this.client.user.tag}`
    );
    this.client.logger.info(
      this.client.padString(
        ` SHARD ${shardId} INIT TOOK ${
          new Date().getTime() - this.client.startTime.getTime()
        } MS `,
        42,
        "="
      ) + "\n"
    );

    if (shardId === this.client.shard.count) {
      this.client.logger.info("ALL SHARDS INITIALIZED");
    }

    const guilds = this.client.guilds.cache;
    for (const [guildId] of guilds) {
      this.guildRepository
        .findOne({ discordId: guildId })
        .then(async (guildRec) => {
          if (!guildRec) {
            const guildRecord = this.guildRepository.create({
              discordId: guildId,
            });
            this.guildRepository.save(guildRecord);
            this.client.logger.debug(`Created guild record for ${guildId}`);
          }
        });
    }
  }
}

export default ReadyListener;
