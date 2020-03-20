import Listener from "../struct/Listener";
import { User, MessageEmbed } from "discord.js";
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

  async exec(user: User, search: Search) {
    const matchedSearch = await this.searchRepository.findOne({
      where: { user_id: Not(user.id) },
      order: {
        started_at: -1
      }
    });

    // equivalent to matchedSearch !== null && matchedSearch !== undefined
    if (matchedSearch) {
      await this.searchRepository.delete(search);
      await this.searchRepository.delete(matchedSearch);

      const chat = this.chatRepository.create({
        user1_id: search.user_id,
        user2_id: matchedSearch.user_id
      });
      await this.chatRepository.save(chat);

      const notificationEmbed = this.client.successEmbed(
        i18n.__(
          "**Собеседник найден!**\n\n" +
            "Правила чата:\n" +
            "```1. Не злоупотребляйте нецензурной лексикой\n" +
            "2. Относитесь с должным уважением как к себе, так и к собеседнику```\n" +
            "Системные уведомления отображаются в виде вставок (пример - то, что вы сейчас читаете)\n" +
            "**Список команд доступных во время чата**:\n" +
            "`!стоп` - остановить чат\n" +
            "`!жалоба` - отправить жалобу на собеседника\n" +
            "`!стоп-поиск` - остановить чат и начать поиск"
        )
      );

      this.client.users
        .filter(u => u.id === user.id || u.id === matchedSearch.user_id)
        .each(user => user.send(notificationEmbed));
    }
  }
}

export default SearchStartedListener;
