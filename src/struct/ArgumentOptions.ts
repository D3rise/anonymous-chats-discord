import { ArgumentOptions } from "discord-akairo";

interface CustomArgumentOptions extends ArgumentOptions {
  required?: boolean;
}

export default CustomArgumentOptions;
