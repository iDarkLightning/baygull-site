import { auth, drive_v3 } from "@googleapis/drive";
import { gaxios } from "google-auth-library";

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
    clientOptions: {
      transporter: new gaxios.Gaxios({ fetchImplementation: fetch }),
    },
  });

  return new drive_v3.Drive({
    auth: _auth,
    fetchImplementation: fetch,
  });
};
