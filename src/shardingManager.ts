import { ShardingManager } from "discord.js";
import path from "path";
try {
  const manager = new ShardingManager(path.join("dist", "bot.js"), {
    totalShards: 1,
    mode: "process"
  });

  manager.spawn();
} catch (e) {
  /* tslint:disable */
  console.error(e);
  process.exit(1);
}
