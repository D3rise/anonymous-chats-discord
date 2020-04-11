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
    const recentlyChats = await this.chatRepository
      .createQueryBuilder("chat")
      .where(
        `(user1_id = :id AND age(current_timestamp, ended_at) < interval '5 minutes')`,
        { id: user.id }
      )
      .orWhere(
        `(user2_id = :id AND age(current_timestamp, ended_at) < interval '5 minutes')`,
        { id: user.id }
      )
      .getMany();

    const recentlyInterlocutors: string[] = [];
    recentlyChats.forEach((chat) => {
      let interlocutorId: string;
      chat.user1Id === user.id
        ? (interlocutorId = chat.user2Id)
        : (interlocutorId = chat.user1Id);
      recentlyInterlocutors.push(interlocutorId);
    });
    recentlyInterlocutors.push(user.id);

    const searchQuery = this.searchRepository
      .createQueryBuilder("search")
      .leftJoinAndSelect("search.user", "user")
      .orderBy("search.started_at")
      .where("user.locale = :locale", { locale: author.locale })
      .andWhere(
        `search.discord_user_id NOT IN ('${recentlyInterlocutors.join(
          "', '"
        )}')`
      );

    this.client.logger.debug(`Started new search with id ${search.id}`);
    if (author.config.preferredGender !== "none") {
      searchQuery.andWhere("user.config ->> 'gender' = :gender", {
        gender: author.config.preferredGender,
      });
    }

    if (search.guildId) {
      searchQuery.andWhere("search.guildId = :guildId", {
        guildId: search.guildId,
      });
    } else {
      searchQuery.andWhere("search.guildId IS NULL");
    }
    const matchedSearches = await searchQuery.getMany();
    const matchedSearch =
      matchedSearches[Math.floor(Math.random() * matchedSearches.length)];

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
        startedAt: new Date(),
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
