import Command from "../struct/Command";
import { Message } from "discord.js";
import { User } from "../entity/User.entity";
import { __ } from "i18n";

class ReportCommand extends Command {
  constructor() {
    super("report", {
      aliases: [__("жалоба"), __("репорт"), __("report")],
      prefix: "!",
      description: __("Отправить жалобу на собеседника"),
      category: __("Чат"),
      channel: "dm"
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
        this.client.errorEmbed(__("Вы не находитесь в чате!"))
      );

    const reportedUser = await this.userRepository.findOne({
      where: {
        user_id:
          chat.user1_id === message.author.id ? chat.user2_id : chat.user1_id
      },
      relations: ["reports"]
    });

    const reportInChat = await this.reportRepository.findOne({
      chat,
      author_discord_id: message.author.id
    });
    if (reportInChat) {
      return message.channel.send(
        this.client.errorEmbed(__("Вы уже отправляли жалобу в этом чате!"))
      );
    }

    const report = this.reportRepository.create({
      user: reportedUser,
      chat,
      author_discord_id: message.author.id,
      date: new Date()
    });
    reportedUser.reports.push(report);

    message.channel.send(
      this.client.successEmbed(
        __("**Жалоба была успешно отправлена!**\n") +
          __(
            "Имейте ввиду, что за жалобу без уважительных на\n" +
              "то причин вам будет выдано предупреждение."
          )
      )
    );

    if (reportedUser.reports.length >= 3) {
      chat.ended_at = new Date();
      reportedUser.banned = true;
      await this.chatRepository.save(chat);

      message.channel.send(
        this.client.errorEmbed(__("Собеседник был заблокирован.\nЧат окончен."))
      );

      const reportedUserDiscord = await this.client.users.fetch(
        reportedUser.user_id
      );

      reportedUserDiscord.send(
        this.client.errorEmbed(
          __("К сожалению, вы были заблокированы.\n") +
            __(
              "Чтобы подать заявку на разблокировку аккаунта, " +
                `напишите администрации на [этом]({{contactServerInvite}}) ` +
                "сервере, почему по вашему мнению блокировка безосновательна.",
              { contactServerInvite: this.client.contactServerInvite }
            )
        )
      );
    }

    await this.reportRepository.save(report);
    await this.userRepository.save(reportedUser);
  }
}

export default ReportCommand;
