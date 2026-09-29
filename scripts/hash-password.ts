/**
 * Generates ADMIN_PASSWORD_HASH for the .env file.
 *
 *   npm run auth:hash-password
 *
 * In an interactive terminal the password is read twice without echoing it.
 * Otherwise it is read from stdin (one trailing newline is stripped).
 */
import {
  formatPasswordHashEnvLine,
  hashPassword,
  validatePasswordForHashing,
} from "../src/features/auth/password-hash";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8").replace(/\r?\n$/, "");
}

function promptHidden(prompt: string): Promise<string> {
  const { stdin, stdout } = process;
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";

    const finish = (error?: Error) => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") return finish();
        if (char === "\u0003") return finish(new Error("Cancelled."));
        if (char === "\u007f" || char === "\b") {
          value = Array.from(value).slice(0, -1).join("");
        } else {
          value += char;
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) return readStdin();

  const password = await promptHidden("Password: ");
  const problem = validatePasswordForHashing(password);
  if (problem) throw new Error(problem);
  const confirmation = await promptHidden("Confirm password: ");
  if (confirmation !== password) throw new Error("Passwords do not match.");
  return password;
}

async function main() {
  const password = await readPassword();
  const passwordHash = await hashPassword(password);

  console.log(formatPasswordHashEnvLine(passwordHash));
  console.error(
    "\nAdd the line above to .env. Each $ is escaped as \\$ because Next.js expands $ in .env files.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
