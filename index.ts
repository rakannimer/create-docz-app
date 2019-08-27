#!/usr/bin/env node
import chalk from "chalk";
import Commander from "commander";
import path from "path";

import checkForUpdate from "update-check";

import { createApp } from "./create-app";
import { validateNpmName } from "./helpers/validate-pkg";
import packageJson from "./package.json";
import { shouldUseYarn } from "./helpers/should-use-yarn";
import { promptUserForProjectName } from "./helpers/prompt-user-for-project-name";

let projectPath: string = "";

const program = new Commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments("<project-directory>")
  .usage(`${chalk.green("<project-directory>")} [options]`)
  .action(name => {
    projectPath = name;
  })
  .option("--use-npm")
  .option(
    "-e, --example <example-path>",
    "an example to bootstrap the app with"
  )
  .allowUnknownOption()
  .parse(process.argv);

async function run() {
  if (typeof projectPath === "string") {
    projectPath = projectPath.trim();
  }

  if (!projectPath) {
    const projectPathFromUser = await promptUserForProjectName();
    if (projectPathFromUser !== false) {
      projectPath = projectPathFromUser;
    }
  }

  if (!projectPath) {
    console.log();
    console.log("Please specify the project directory:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
    );
    console.log();
    console.log("For example:");
    console.log(
      `  ${chalk.cyan(program.name())} ${chalk.green("my-docz-app")}`
    );
    console.log();
    console.log(
      `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
    );
    process.exit(1);
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectName = path.basename(resolvedProjectPath);

  const { valid, problems } = validateNpmName(projectName);
  if (!valid) {
    console.error(
      `Could not create a project called ${chalk.red(
        `"${projectName}"`
      )} because of npm naming restrictions:`
    );

    problems!.forEach(p => console.error(`    ${chalk.red.bold("*")} ${p}`));
    process.exit(1);
  }

  const shouldUseNpm = Boolean(program.useNpm);
  const example =
    typeof program.example === "string" && program.example.trim()
      ? program.example.trim()
      : "basic";

  await createApp({
    appPath: resolvedProjectPath,
    useNpm: shouldUseNpm,
    example
  });
}

const update = checkForUpdate(packageJson).catch(() => null);

async function notifyUpdate() {
  try {
    const res = await update;
    if (res && res.latest) {
      const isYarn = shouldUseYarn();

      console.log();
      console.log(
        chalk.yellow.bold("A new version of `create-next-app` is available!")
      );
      console.log(
        "You can update by running: " +
          chalk.cyan(
            isYarn
              ? "yarn global add create-next-app"
              : "npm i -g create-next-app"
          )
      );
      console.log();
    }
  } catch {
    // ignore error
  }
}

run()
  .then(notifyUpdate)
  .catch(async reason => {
    console.log();
    console.log("Aborting installation.");
    if (reason.command) {
      console.log(`  ${chalk.cyan(reason.command)} has failed.`);
    } else {
      console.log(chalk.red("Unexpected error. Please report it as a bug:"));
      console.log(reason);
    }
    console.log();

    await notifyUpdate();

    process.exit(1);
  });
