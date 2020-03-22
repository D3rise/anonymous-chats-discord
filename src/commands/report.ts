import Command from "../struct/Command";
import { Message } from "discord.js";
import { User } from "../entity/User.entity";
import { __ } from "i18n";

class ReportCommand extends Command {
  constructor() {
    super("report", {
      aliases: ["report"],
      prefix: "!",
      description: "commands.report.desc",
      category: "categories.chat",
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
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
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
        this.client.errorEmbed(__("errors.youHaveBeenSendedReportInThisChat"))
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
        __("commands.report.reportHasBeenSended") +
          __("commands.report.reportDisclaimer")
      )
    );

    if (reportedUser.reports.length >= 3) {
      chat.ended_at = new Date();
      reportedUser.banned = true;
      await this.chatRepository.save(chat);

      message.channel.send(
        this.client.errorEmbed(__("commands.report.chatHasEndedUserBanned"))
      );

      const reportedUserDiscord = await this.client.users.fetch(
        reportedUser.user_id
      );

      reportedUserDiscord.send(
        this.client.errorEmbed(
          __("errors.banned", {
            contactServerInvite: this.client.contactServerInvite
          })
        )
      );
    }

    await this.reportRepository.save(report);
    await this.userRepository.save(reportedUser);
  }
}

export default ReportCommand;
