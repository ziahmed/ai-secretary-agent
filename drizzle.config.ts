import { defineConfig } from "drizzle-kit";
import { URL } from "url";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Add SSL parameter for TiDB
const url = new URL(connectionString);
if (!url.searchParams.has('ssl')) {
  url.searchParams.set('ssl', 'true');
}
const finalConnectionString = url.toString();

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: finalConnectionString,
  },
});
