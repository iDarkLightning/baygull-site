import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

export const createDriveClient = () => {
  const meta = JSON.parse(process.env.SERVICE_ACCOUNT_META!);
  const key = process.env.SERVICE_ACCOUNT_KEY!;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      ...meta,
      private_key: key,
    },
    scopes: SCOPES,
  });

  return google.drive({ version: "v3", auth });
};
