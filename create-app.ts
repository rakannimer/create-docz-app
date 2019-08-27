import chalk from "chalk";
import cpy from "cpy";
import fs from "fs";
import makeDir from "make-dir";
import os from "os";
import path from "path";

import { downloadAndExtractExample, hasExample } from "./helpers/examples";
import { install } from "./helpers/install";
import { isFolderEmpty } from "./helpers/is-folder-empty";
import { getOnline } from "./helpers/is-online";
import { shouldUseYarn } from "./helpers/should-use-yarn";

export async function createApp({
  appPath,
  useNpm,
  example
}: {
  appPath: string;
  useNpm: boolean;
  example: string;
}) {
  const found = await hasExample(example);
  if (!found) {
    console.error(
      `Could not locate an example named ${chalk.red(
        `"${example}"`
      )}. Please check your spelling and try again.`
    );
    process.exit(1);
  }

  const root = path.resolve(appPath);
  const appName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = useNpm ? false : shouldUseYarn();
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  const displayedCommand = useYarn ? "yarn" : "npm";
  console.log(`Creating a new Docz app in ${chalk.green(root)}.`);
  console.log();

  await makeDir(root);
  process.chdir(root);

  if (example) {
    console.log(
      `Downloading files for example ${chalk.cyan(
        example
      )}. This might take a moment.`
    );
    console.log();
    await downloadAndExtractExample(root, example);

    console.log("Installing packages. This might take a couple of minutes.");
    console.log();

    await install(root, null, { useYarn, isOnline });
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} ${useYarn ? "" : "run "}dev`));
  console.log("    Starts docz in dev mode.");
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? "" : "run "}build`)
  );
  console.log("    Builds the docz app for production.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(
    `  ${chalk.cyan(`${displayedCommand} ${useYarn ? "" : "run "}dev`)}`
  );
  console.log();
}
