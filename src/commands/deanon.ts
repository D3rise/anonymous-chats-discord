import { Message } from "discord.js";
import { __ } from "i18n";
import Command from "../struct/Command";

class DeanonCommand extends Command {
  constructor() {
    super("deanon", {
      aliases: ["deanon"],
      category: "categories.chat",
      description: "commands.deanon.desc",
      prefix: "!",
      channel: "dm",
    });
  }

  async exec(message: Message) {
    if (!this.chat) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAreNotInTheChat"))
      );
    }

    if (this.chat.deanonApprovalUsers.includes(message.author.id)) {
      return message.channel.send(
        this.client.errorEmbed(__("errors.youAlreadyVotedForDeanon"))
      );
    }

    const user2 = await this.client.users.fetch(
      this.userChatId === "user1Id" ? this.chat.user2Id : this.chat.user1Id
    );

    if (this.chat.deanonApprovalUsers.length === 2) {
      this.chat.deanonApprovalUsers.push(message.author.id);
      await this.chatRepository.save(this.chat);

      message.author.send(
        this.client.successEmbed(
          __("commands.deanon.tagOfYourBro", { userTag: user2.tag })
        )
      );
      user2.send(
        this.client.successEmbed(
          __("commands.deanon.tagOfYourBro", {
            userTag: message.author.tag,
          })
        )
      );
      return;
    }

    this.chat.deanonApprovalUsers.push(message.author.id);
    await this.chatRepository.save(this.chat);
    message.author.send(
      this.client.successEmbed(__("commands.deanon.youOfferedDeanon"))
    );
    user2.send(this.client.successEmbed(__("commands.deanon.deanonOffer")));
    return;
  }
}

export default DeanonCommand;
