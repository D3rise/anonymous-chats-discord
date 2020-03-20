import { ShardingManager } from "discord.js";
import path from "path";
const manager = new ShardingManager(path.join("dist", "bot.js"), {
  totalShards: 1,
  mode: "process"
});

manager.spawn();
