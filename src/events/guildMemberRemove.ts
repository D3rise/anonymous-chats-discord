import Listener from "../struct/Listener";
import { GuildMember } from "discord.js";

class GuildMemberRemoveListener extends Listener {
  constructor() {
    super("guildMemberRemove", {
      event: "guildMemberRemove",
      emitter: "client",
    });
  }

  async exec(member: GuildMember) {
    if (member.user.bot) return;
    const search = await this.searchRepository
      .createQueryBuilder("search")
      .leftJoinAndSelect("search.user", "user")
      .where("user.userId = :id", { id: member.id })
      .getOne();

    let cachedUser: GuildMember;
    this.client.guilds.forEach((guild) => {
      cachedUser = guild.members.get(member.id);
    });

    if (cachedUser === undefined && search) {
      await this.searchRepository.delete(search);
      return this.client.logger.debug(
        `Deleted search record with id ${search.id} because of member leaving`
      );
    }
  }
}

export default GuildMemberRemoveListener;
