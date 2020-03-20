import Command from "../struct/Command";
import moment from "moment-timezone";
import { Message } from "discord.js";

class StopSearchCommand extends Command {
  constructor() {
    super("stop-search", {
      aliases: ["стоп-поиск", "споиск", "конец-поиск", "отмена-поиск"],
      category: "Чат",
      prefix: "!",
      channel: "dm",
      description: "Остановить текущий чат и начать поиск"
    });
  }

  async exec(message: Message) {
    const chat = await this.chatRepository.findOne({
      where: [
        { user1_id: message.author.id, ended_at: null },
        { user2_id: message.author.id, ended_at: null }
      ]
    });

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed("Вы не находитесь в чате!")
      );

    const embed = this.client.successEmbed("Собеседник покинул чат.");
    if (chat.user1_id === message.author.id) {
      this.client.users.find(user => user.id === chat.user2_id).send(embed);
    } else {
      this.client.users.find(user => user.id === chat.user1_id).send(embed);
    }

    chat.ended_at = new Date();
    await this.chatRepository.save(chat);

    message.channel.send(this.client.successEmbed("Чат был окончен."));

    // SEARCH COMMAND //
    const handleMessageError = () =>
      message.channel.send(
        this.client.errorEmbed(
          "К сожалению, бот не может отправить вам сообщение.\n" +
            "Проверьте свои настройки конфиденциальности."
        )
      );

    if (message.guild !== null)
      message.delete({
        reason: "Команда поиска собеседника"
      });

    let userSearchRecord = await this.searchRepository.findOne({
      user_id: message.author.id
    });

    if (userSearchRecord) {
      const diff = moment().diff(moment(userSearchRecord.started_at));

      await this.searchRepository.delete(userSearchRecord);
      return message.author
        .send(
          this.client.errorEmbed(
            `Поиск собеседника был отменен.\nВремя ожидания: ${moment
              .duration(diff, "milliseconds")
              .format("HH часов, mm минут, ss секунд")}`
          )
        )
        .catch(handleMessageError);
    }

    userSearchRecord = this.searchRepository.create({
      user_id: message.author.id,
      started_at: new Date()
    });
    await this.searchRepository.save(userSearchRecord);

    message.author
      .send(
        this.client.successEmbed(
          "Поиск собеседника был начат.\n" +
            `На данный момент собеседника ищут: ${(await this.searchRepository.count()) -
              1} человек(а) не включая вас`
        )
      )
      .catch(handleMessageError);

    this.client.emit("searchStarted", message.author, userSearchRecord);
  }
}

export default StopSearchCommand;
