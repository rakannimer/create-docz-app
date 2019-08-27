import prompts from "prompts";
import path from "path";

import { validateNpmName } from "./validate-pkg";

export const promptUserForProjectName = async () => {
  const res = await prompts({
    type: "text",
    name: "path",
    message: "What is your project named?",
    initial: "my-app",
    validate: name => {
      const validation = validateNpmName(path.basename(path.resolve(name)));
      if (validation.valid) {
        return true;
      }
      return "Invalid project name: " + validation.problems![0];
    }
  });
  if (typeof res.path === "string") {
    return res.path.trim();
  }
  return false;
};
