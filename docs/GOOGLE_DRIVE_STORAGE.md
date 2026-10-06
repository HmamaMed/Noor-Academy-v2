# Academy file storage on Google Drive

The application stores material metadata and class permissions in PostgreSQL. Uploaded file bytes live in a private Google Drive folder. Only an administrator, the group's assigned teacher, or a student with a CONFIRMED enrollment can access its workspace and download files through the API. Students cannot publish or remove materials.

Drive provides storage; it does not replace the Spring Boot backend or PostgreSQL. A hosted backend (the existing Render service, for example) still authenticates requests, calls Drive, and returns files. The backend does not retain uploaded media on its filesystem.

## Available now, without credentials

Teachers can publish lesson text and attach existing `https://drive.google.com/...` or `https://docs.google.com/...` links. Google controls the permissions of these existing links: share them with the students' Google accounts yourself. A public link can be forwarded outside the class. The app does not fetch or change permissions on externally linked files.

## Connect a personal Google account for private uploads

Use a dedicated academy account rather than your personal everyday account.

1. Create a Google Cloud project and enable the Google Drive API.
2. Configure the OAuth consent screen and add the academy Google account as a test user while developing.
3. Create an OAuth client of type **Web application**. Add this authorized redirect URI exactly: `http://localhost:8765/oauth/callback`.
4. In your local terminal, set `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`. Keep secrets out of frontend files and Git.
5. From the project root, run:

   ```bash
   python3 backend/scripts/connect_drive.py
   ```

   The script opens Google's consent screen. After your approval, it creates a private **Noor Academy Materials** folder and writes credentials to `backend/.env.drive` with owner-only permissions. This file is ignored by Git. The script requests the `drive.file` scope: access to files created with this app, rather than your entire Drive.

6. For local development, load the generated environment before starting the backend:

   ```bash
   source backend/.env.drive
   cd backend
   ./mvnw spring-boot:run
   ```

7. For Render or another host, copy the four values into the service's secret environment settings:

   - `GOOGLE_DRIVE_CLIENT_ID`
   - `GOOGLE_DRIVE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_REFRESH_TOKEN`
   - `GOOGLE_DRIVE_FOLDER_ID`

8. Restart the backend. The teacher's class workspace will enable **Attach a file**.

No students need to sign in to Google for files uploaded through the app. Uploaded files are not made public; the backend's OAuth account reads them after checking academy permissions. Files download as attachments rather than executing inline in the app.

### OAuth testing and production

Google OAuth apps with External user type and publishing status Testing normally issue refresh tokens that expire after seven days for Drive scopes. Publish/configure your OAuth app appropriately for continued use and follow Google's verification requirements where applicable. If authorization is revoked or expires, reconnect storage. Do not send your credentials in chat.

The setup helper currently creates a folder in the OAuth account's **My Drive**. A service account alone cannot own My Drive files because it has no storage quota. Workspace shared drives can be used with an appropriately authorized OAuth account and accessible folder; this release does not include service-account credential handling.

## Limits and operations

- Upload limit: **25 MB per file**, with a 26 MB multipart request limit. This implementation buffers files during transfer; it is intended for documents and modest audio/video attachments, rather than large streaming media. For larger media, use existing Drive links.
- Material categories: lessons, exercises, corrections, and other resources. Plain text is rendered as text, not HTML.
- Storage status in the UI indicates whether credentials are configured, not whether Google has accepted them. Upload errors show a useful message if authorization or quota fails.
- Removing an uploaded material removes its database record, then deletes its Drive file after commit. If Drive deletion fails, the backend logs the file ID for manual cleanup. Existing linked files are never deleted.
- If a database transaction fails after an upload, the app attempts to delete the new Drive file. A process crash or failed cleanup can leave an orphan in Drive; periodically review the academy folder.
- Do not manually delete or move the storage folder while the application is using it. Back up the PostgreSQL database as well as the Drive files.
- Payment confirmation remains an administrator action. This feature does not add payment processing, student submissions, grading, chat, or live video.

## API

| Method | Path                                            | Purpose                                                         |
| ------ | ----------------------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/workspaces/{groupId}`                     | Group details, permissions, storage status, and materials       |
| POST   | `/api/workspaces/{groupId}/materials`           | Multipart upload: JSON `metadata` part and optional `file` part |
| GET    | `/api/workspaces/{groupId}/materials/{id}/file` | Permission-checked private download                             |
| DELETE | `/api/workspaces/{groupId}/materials/{id}`      | Remove material and clean up its uploaded file                  |

`metadata` contains `title`, `description`, `type` (`LESSON`, `EXERCISE`, `CORRECTION`, `OTHER`), and optional `externalUrl`. Include lesson text, a link, or a file.

References: [Google Drive uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [downloads](https://developers.google.com/workspace/drive/api/guides/manage-downloads), [OAuth server flow](https://developers.google.com/identity/protocols/oauth2/web-server), [refresh token expiration](https://developers.google.com/identity/protocols/oauth2#expiration), and [shared drives and service-account storage](https://developers.google.com/workspace/drive/api/guides/about-shareddrives).
