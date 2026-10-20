# Clinic Offline — laptop + three phones

Requires Windows 10/11 (64-bit). The portable package includes its own Node.js runtime and local SQLite storage. Internet is needed once on the laptop to activate the default Super Admin using the existing online password. Afterwards, normal use requires no internet, Supabase connection or npm installation.

## Start using the prepared package

1. Extract `clinic-offline-windows.zip` to a permanent folder, for example `Documents\Clinic Offline`. Do not run it inside the ZIP.
2. Double-click **Start Clinic.cmd**. Keep its window open.
3. Open **http://127.0.0.1:4317** in Edge or Chrome.
4. Activate the default Super Admin **abu.bakar041295@gmail.com** using the first-run screen on the laptop. Enter the existing online password; the app verifies that it belongs to the active online Super Admin, copies the account name, and stores only a salted password hash locally. Use the same email/password to sign in offline on any of the four devices. The online password cannot be extracted or bundled automatically.
5. Under Staff, create local Doctor and Assistant accounts. Register patients and book appointments as Super Admin or Assistant; sign in as Doctor for consultations and prescriptions.
6. Set your trusted clinic Wi-Fi network profile to **Private** in Windows Settings. If needed, double-click **Enable Clinic WiFi.cmd** and approve the Windows administrator prompt. This adds one inbound rule for the bundled runtime, TCP 4317, Private networks and the local subnet only.
7. Connect all three phones to the **same clinic Wi-Fi**. Open the phone URL printed by Start Clinic (for example `http://192.168.1.18:4317`). Do not enter localhost on a phone: that points to the phone itself. Super Admin can also find the laptop addresses in Settings.
8. Sign in separately on each device with the relevant local role. All four devices use **one database on the laptop**. No installation is needed on the phones.
9. Keep the laptop awake and connected. When finished, close the browser and press Ctrl+C in the server window.

Records, permanent patient tokens, bookings, appointment statuses, prescriptions, receipts, staff accounts, services and timings are saved locally and survive restarting the app or computer. The laptop hosts the app on the clinic Wi-Fi. Run just one server and keep its data folder on the laptop. Signed-in screens reload authorized records automatically every two seconds; returning to a browser tab also refreshes it. Registration, bookings, consultation status, prescription history, staff changes, services, timings and saved receipts use the same shared database. Super Admin and Assistant see clinic-wide records; each Doctor sees their assigned patients, bookings and their own prescriptions. Each device has its own session; signing out on one device does not sign out the others.

The header reports loss of connection. Devices cannot save when disconnected from the laptop; reconnect to clinic Wi-Fi to resume. This is an offline **local network** edition, not four independent databases. Internet is unnecessary, but Wi-Fi connectivity between the devices and laptop is required. If the router's guest/client isolation is enabled, disable it for these clinic devices or use a network that allows devices to communicate. Reserve the laptop's IP in the router if its address changes frequently.

Use a trusted, password-protected clinic Wi-Fi. The local address uses HTTP; do not expose it on public Wi-Fi or forward port 4317 to the internet. The supplied firewall helper intentionally does not allow Public networks. For multiple laptop network adapters, choose the printed address on the same Wi-Fi as the phones.

Concurrent duplicate phone registrations or doctor time slots are rejected. If two devices change the same booking state, services or timings from stale data, the stale write is rejected with an instruction to wait for sync and retry. Draft form text is not shared between devices.

The online site and Supabase records are unchanged. Existing offline databases and offline backup format remain compatible. Before replacing the old offline package, download a backup, stop the old server, replace application files, and preserve its `data` folder (or restore the backup in the new package). Never run two copies as separate servers. This edition starts with no clinical records and does not synchronize them with the online version. Do not assume a patient registered online is available offline. Backups from this offline edition are the supported restore format.

## Default Super Admin credentials

The fixed default email is **abu.bakar041295@gmail.com** and the Super Admin login form prefills it. Activation must be completed on the laptop at its loopback address, not on a phone. A wrong online password, inactive online profile or non-admin role cannot activate this account. Once activated, ordinary login checks only the local password hash, including after restarting the server without internet.

If upgrading an older database that already has local accounts, they remain available. On the laptop login screen, choose **Activate default Super Admin** to add/verify the default account without deleting existing records. Super Admin accounts cannot be deleted or deactivated through staff management.

Later online password changes do not automatically reach a disconnected laptop. To update the offline copy, open Settings as a local Super Admin and reset `abu.bakar041295@gmail.com` using its **current online password**. This update requires internet verification; other local accounts can still be reset offline. Keep a backup and your admin credentials safe.

The package contains only the public online project URL and anonymous key in `online-auth.json`; it never includes a service-role key, plaintext password or online session token. The temporary verification session is closed separately from your existing online sessions. Clinical records remain local.

## Four-device acceptance check at the clinic

Automated tests simulate the four clients; they cannot confirm your physical phones, router isolation or Windows firewall. After setup, perform this check:

1. Keep Patients open on the laptop as Super Admin. Register a test patient on phone 1 as Assistant. It should appear on the laptop within about two seconds.
2. Book that patient with the Doctor signed in on phone 2. Their Patients/Bookings screen should update without reloading. An unassigned Doctor on phone 3 should not see that patient.
3. Change the booking status and save a prescription as the assigned Doctor. Open the patient chart on reception/laptop; the new prescription should appear automatically.
4. Open the same booking receipt on another authorized device; the saved receipt number and amount should match.
5. Change a doctor's service/timings while another authorized device has that screen open. The saved values should update. Unsaved edits remain local; conflicting saves show an error.
6. Turn off phone Wi-Fi, wait for the disconnected message, reconnect, and confirm the header returns to Connected. Sign out on that phone and confirm the other devices stay signed in.

## Backup and restore

Sign in as Super Admin and open **Settings**. Download a backup at the end of each day and copy it to a separate drive. Backups include all local clinical records and account password hashes; protect access to these files. The application database itself is not encrypted: protect the Windows account and use drive encryption where available.

Restore replaces all local records and accounts after confirmation. The server checks the backup structure and saves a `before-restore-*.json` safety copy in `data` before replacement. Sign in with an account from the restored backup. If the backup predates default-admin activation, activate that account again from the laptop login screen. Super Admin can reset other local account passwords in Settings; there is no email password recovery. Keep a recent backup and your admin credentials safe.

The working database is `data\clinic.sqlite` beside `server.mjs`. Do not delete this folder or replace it when upgrading. To copy the entire application folder, stop the server first so SQLite closes cleanly. Downloads are snapshots made from the database while the app runs, so the Settings backup button is the preferred backup method.

## Developer commands (source checkout only)

- `npm run offline:test` tests online-password verification with mocked responses, clinical workflows and four independent LAN sessions, including role restrictions and concurrent write conflicts, against temporary databases without contacting Supabase.
- `node offline/browser-check.mjs` runs an optional hidden Chrome check on Windows using a temporary database and browser profile; checks setup, login, registration, reload, local icons, settings, and absence of external requests. Build the offline frontend first.
- `node offline/multidevice-browser-check.mjs` verifies one laptop and three independent 390px mobile browser sessions on the actual LAN HTTP address, automatic screen updates, local UUID creation, role restrictions, receipts, preferences and Wi-Fi disconnect/reconnect. Requires Chrome on Windows and a private LAN address. It uses temporary data and does not touch clinic records.
- `npm run offline:build` builds a separate frontend to `offline/dist` and prepares `offline/release/Clinic Offline`, including the current Node runtime. Build using Node 24 or later on Windows to produce the Windows package.
- `npm run offline:start` serves `offline/dist` at http://127.0.0.1:4317 with records in `offline/data`.
- Normal `npm run build`, Vercel configuration and the online source adapter are unchanged. Offline builds never load `.env.local`.

Optional server environment variables: `CLINIC_OFFLINE_HOST` (default `0.0.0.0`; set to `127.0.0.1` to disable LAN access), `CLINIC_OFFLINE_PORT` (default 4317) and `CLINIC_OFFLINE_DATA` (database directory). If you customize the port, use the matching address in your browser.

The icon font is bundled locally in `public` under Google's Material Symbols Apache 2.0 license. System fonts replace online web fonts. The only cloud calls are explicit default-admin activation/password verification. Routine clinic use stays on the laptop's local network.
