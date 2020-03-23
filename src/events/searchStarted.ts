import Listener from "../struct/Listener";
import { User } from "discord.js";
import { User as UserEntity } from "../entity/User.entity";
import { Search } from "../entity/Search.entity";
import i18n from "i18n";

class SearchStartedListener extends Listener {
  constructor() {
    super("searchStarted", {
      emitter: "client",
      event: "searchStarted"
    });
  }

  async exec(user: User, author: UserEntity, search: Search) {
    const matchedSearch = await this.searchRepository
      .createQueryBuilder("search")
      .leftJoinAndSelect("search.user", "user")
      .where("user.locale = :locale", { locale: author.locale })
      .andWhere("search.discord_user_id != :userId", { userId: user.id })
      .orderBy("search.started_at")
      .getOne();

    // findOne({
    //   relations: ["user"],
    //   where: {
    //     discord_user_id: Not(user.id),
    //     user: {
    //       locale: author.locale
    //     }
    //   },
    //   order: {
    //     started_at: -1
    //   }
    // });

    // equivalent to matchedSearch !== null && matchedSearch !== undefined
    if (matchedSearch) {
      await this.searchRepository.delete(search);
      await this.searchRepository.delete(matchedSearch);

      const chat = this.chatRepository.create({
        user1Id: search.discordUserId,
        user2Id: matchedSearch.discordUserId,
        locale: author.locale
      });
      await this.chatRepository.save(chat);

      const notificationEmbed = this.client.successEmbed(
        i18n.__({
          phrase: "other.searchWasFoundReadTheRules",
          locale: author.locale
        })
      );

      this.client.users
        .filter(u => u.id === user.id || u.id === matchedSearch.discordUserId)
        .each(interlocutorUser => interlocutorUser.send(notificationEmbed));

      this.client.emit("chatStarted", chat);
    }
  }
}

export default SearchStartedListener;
