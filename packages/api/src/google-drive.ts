import { drive, auth } from "@googleapis/drive";

const SCOPES = ["https://www.googleapis.com/auth/drive"];

export const createDriveClient = () => {
  const meta = JSON.parse(process.env.SERVICE_ACCOUNT_META!);
  const key = process.env.SERVICE_ACCOUNT_KEY!;

  const _auth = new auth.GoogleAuth({
    credentials: {
      ...meta,
      private_key: key,
    },
    scopes: SCOPES,
  });

  return drive({ version: "v3", auth: _auth });
};
