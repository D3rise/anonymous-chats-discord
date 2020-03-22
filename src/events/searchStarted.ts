import Listener from "../struct/Listener";
import { User, MessageEmbed } from "discord.js";
import { User as UserEntity } from "../entity/User.entity";
import { Search } from "../entity/Search.entity";
import { Chat } from "../entity/Chat.entity";
import { getRepository, Repository, Not } from "typeorm";
import i18n from "i18n";

class SearchStartedListener extends Listener {
  searchRepository: Repository<Search>;
  chatRepository: Repository<Chat>;

  constructor() {
    super("searchStarted", {
      emitter: "client",
      event: "searchStarted"
    });

    this.searchRepository = getRepository(Search);
    this.chatRepository = getRepository(Chat);
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
        user1_id: search.discord_user_id,
        user2_id: matchedSearch.discord_user_id,
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
        .filter(u => u.id === user.id || u.id === matchedSearch.discord_user_id)
        .each(user => user.send(notificationEmbed));
    }
  }
}

export default SearchStartedListener;
