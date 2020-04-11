import Command from "../struct/Command";
import { Message } from "discord.js";
import { __ } from "i18n";

class ReportCommand extends Command {
  constructor() {
    super("report", {
      aliases: ["report"],
      prefix: "!",
      description: "commands.report.desc",
      category: "categories.chat",
      channel: "dm",
    });
  }

  async exec(message: Message) {
    const chat = this.chat;

    if (!chat)
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );

    const reportedUser = await this.userRepository.findOne({
      where: {
        userId:
          chat.user1Id === message.author.id ? chat.user2Id : chat.user1Id,
      },
      relations: ["reports"],
    });

    const reportInChat = await this.reportRepository.findOne({
      chat,
      authorDiscordId: message.author.id,
    });
    if (reportInChat) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.youHaveBeenSendedReportInThisChat"))
      );
    }

    const report = this.reportRepository.create({
      user: reportedUser,
      chat,
      authorDiscordId: message.author.id,
      date: new Date(),
    });
    reportedUser.reports.push(report);

    message.channel.send(
      this.client.successEmbed(
        __("commands.report.reportHasBeenSended") +
          " " +
          __("commands.report.reportDisclaimer")
      )
    );

    if (reportedUser.reports.length >= 3) {
      chat.endedAt = new Date();
      reportedUser.banned = true;
      await this.chatRepository.save(chat);

      message.channel.send(
        this.client.errorEmbed(__("commands.report.chatHasEndedUserBanned"))
      );

      const reportedUserDiscord = await this.client.users.fetch(
        reportedUser.userId
      );

      reportedUserDiscord.send(
        this.client.errorEmbed(
          __("errors.banned", {
            contactServerInvite: this.client.options.contactServerInvite,
          })
        )
      );
    }

    await this.reportRepository.save(report);
    await this.userRepository.save(reportedUser);
  }
}

export default ReportCommand;
