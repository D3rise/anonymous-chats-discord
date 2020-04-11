import { CommandOptions } from "discord-akairo";
import ArgumentOptions from "./ArgumentOptions";

interface CustomCommandOptions extends CommandOptions {
  args?: ArgumentOptions[];
}

export default CustomCommandOptions;
