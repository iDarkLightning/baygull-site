import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@baygull/db";

export const auth = betterAuth({
  baseURL: process.env.BASE_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "number",
        required: true,
        defaultValue: 0,
        fieldName: "role",
        returned: true,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.email === process.env.SUPERUSER_EMAIL) {
            return {
              data: {
                ...user,
                role: 2,
              },
            };
          }

          return { data: user };
        },
      },
    },
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
});
