import Listener from "../struct/Listener";
import { Guild, GuildMember } from "discord.js";

class GuildDeleteListener extends Listener {
  constructor() {
    super("guildDelete", {
      event: "guildDelete",
      emitter: "client",
    });
  }

  async exec(guild: Guild) {
    guild.members.forEach(async (member) => {
      const search = await this.searchRepository
        .createQueryBuilder("search")
        .leftJoinAndSelect("search.user", "user")
        .where("user.userId = :id", { id: member.id })
        .getOne();

      let cachedUser: GuildMember;
      this.client.guilds.forEach((otherGuild) => {
        cachedUser = otherGuild.members.get(member.id);
      });

      if (cachedUser === undefined && search) {
        await this.searchRepository.delete(search);
        return this.client.logger.debug(
          `Deleted search record with id ${search.id} because of guild leaving`
        );
      }
    });
  }
}

export default GuildDeleteListener;
