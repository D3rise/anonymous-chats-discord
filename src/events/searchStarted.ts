import Listener from "../struct/Listener";
import { User } from "discord.js";
import { User as UserEntity } from "../entity/User.entity";
import { Search } from "../entity/Search.entity";
import i18n, { __ } from "i18n";

class SearchStartedListener extends Listener {
  constructor() {
    super("searchStarted", {
      emitter: "client",
      event: "searchStarted",
    });
  }

  async exec(user: User, author: UserEntity, search: Search) {
    const searchQuery = this.searchRepository
      .createQueryBuilder("search")
      .leftJoinAndSelect("search.user", "user")
      .orderBy("search.started_at")
      .where("user.locale = :locale", { locale: author.locale })
      .andWhere("search.discord_user_id != :userId", { userId: user.id });

    this.client.logger.debug(`Started new search with id ${search.id}`);
    if (author.config.preferredGender !== "none") {
      searchQuery.andWhere("user.config ->> 'gender' = :gender", {
        gender: author.config.preferredGender,
      });
    }

    if (author.config.guild) {
      searchQuery.andWhere("search.guildId = :guildId", {
        guildId: search.guildId,
      });
    }
    const matchedSearch = await searchQuery.getOne();

    // equivalent to matchedSearch !== null && matchedSearch !== undefined
    if (matchedSearch) {
      const preferredGender = matchedSearch.user.config.preferredGender;
      const guildOnly = matchedSearch.user.config.guild;

      if (
        (preferredGender !== "none" &&
          preferredGender !== author.config.gender) ||
        (guildOnly && search.guildId !== matchedSearch.guildId)
      ) {
        return;
      }

      await this.searchRepository.delete(search);
      await this.searchRepository.delete(matchedSearch);

      const chat = this.chatRepository.create({
        user1Id: search.discordUserId,
        user2Id: matchedSearch.discordUserId,
        locale: author.locale,
      });
      await this.chatRepository.save(chat);

      const notificationEmbed = this.client.successEmbed(
        i18n.__(
          {
            phrase: "other.searchWasFoundReadTheRules",
            locale: author.locale,
          },
          {
            gender: __(
              this.client.humanizeSetting(matchedSearch.user.config.gender)
            ),
          }
        )
      );

      this.client.users
        .filter((u) => u.id === user.id || u.id === matchedSearch.discordUserId)
        .each((interlocutorUser) => interlocutorUser.send(notificationEmbed));

      this.client.emit("chatStarted", chat);
    }
  }
}

export default SearchStartedListener;
