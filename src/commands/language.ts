import Command from "../struct/Command";
import { Message } from "discord.js";
import { __, getLocales } from "i18n";

class LanguageCommand extends Command {
  constructor() {
    super("language", {
      aliases: ["language", "set-language"],
      category: "categories.config",
      description: "commands.language.desc",
      args: [
        {
          id: "newLocale",
          description: "commands.language.args.newLocale.desc",
        },
      ],
    });
  }

  async exec(message: Message, args: any) {
    let language = __(this.getLanguage(this.user.locale));
    const locales = getLocales();
    const languages = locales.join(`, `);

    if (!args.newLocale) {
      return message.channel.send(
        this.client.successEmbed(
          __("commands.language.currentLanguage", {
            language,
            languages,
          })
        )
      );
    }

    const newLocale = args.newLocale.toLowerCase();
    if (!locales.includes(newLocale)) {
      return message.channel.send(
        this.client.errorEmbed(
          __("commands.language.thisLanguageDoesNotExistPleaseUseOneOfThose", {
            languages,
          })
        )
      );
    }

    this.user.locale = newLocale;
    await this.userRepository.save(this.user);

    language = __({ phrase: this.getLanguage(newLocale), locale: newLocale });
    return message.channel.send(
      this.client.successEmbed(
        __(
          { phrase: "commands.language.languageHasChanged", locale: newLocale },
          { language }
        )
      )
    );
  }

  getLanguage(locale: string) {
    switch (locale) {
      case "ru":
        return "commands.language.russian";
      case "en":
        return "commands.language.english";
    }
  }
}

export default LanguageCommand;
