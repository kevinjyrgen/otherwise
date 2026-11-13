# Team OtherWise – Wise Hackathon 2026

**Wise Guided Transfers**: a proposed Wise feature. An account owner who is not confident with apps chooses a trusted helper. The helper prepares a money transfer for her, the owner checks it and confirms it herself. The helper can never send money.

Demo users (no login): owner **Tiiu** (1,240.50 EUR) and helper **Mari Tamm**.

Vite + React + Tailwind CSS frontend, Node + Express + Socket.IO server in `/server`.

## How to run

```bash
npm install
npm run dev
```

This starts the server (port 3001) and the web app (port 5173) together.

- Laptop: open the `Local` URL that Vite prints, e.g. `http://localhost:5173`.
- Phones on the same Wi-Fi: open the `Network` URL that Vite prints.
- `/demo` lets you pick a person and reset the demo. `/owner` is Tiiu, `/helper` is Mari.

For the demo, put two browser windows side by side: `/owner` on the left, `/helper` on the right.

## What is in the app

- **Home**: a mock app home page with balances and recent activity. Only Home, Guided Transfers and Helper work; the other menu items say "Not part of this prototype".
- **Helper** (owner only): add a helper, see the invite status, change when she gets help, remove or change her helper.
- **Guided Transfers**: the owner asks for a transfer, the helper prepares it, the owner approves and confirms.
- **Send money** (owner's Home): a basic transfer. Depending on her help setting it is sent directly or becomes a request to her helper.

## Reset the demo

There are two starting points, as buttons on `/demo`:

- **Reset: no helper yet**: to show adding a helper.
- **Reset: Mari already added**: to show a transfer. Mari is the active helper and Tiiu gets help when a transfer is over 100 EUR.

From the terminal:

```bash
npm run reset
```

This is the same as "Mari already added". Both ways put the balance back to 1,240.50 EUR and remove all transfers and notifications. They work while the app is running; open windows update by themselves.

## The rules

All of these are enforced on the server and covered by `npm test`.

Transfers:

- Only the helper can fill in or change a prepared transfer, and only until she submits it. After that she can only cancel it.
- Only the owner can approve, decline or confirm. The helper has no route for it.
- The owner's confirmation must repeat the IBAN and amount she saw; the server rejects it if they differ.
- A double tap on confirm sends once.

Helper link:

- Only the owner can invite a helper, change the help setting, or remove or change her helper. She has one helper at a time.
- Only the invited person can accept or decline the invite.
- Only an active helper can prepare transfers. With no helper, or an invite that is not accepted yet, nothing can be prepared.
- Removing a helper cancels the transfers she had not submitted yet and tells her. Transfers she already submitted stay with the owner to decide.
- The helper sees the owner's balance only while she is preparing a transfer the owner asked for. At any other moment the server refuses.
- The helper never sees transfers the owner sends on her own.

Help setting:

- "Help me with every transfer": every Send money becomes a request to the helper.
- "Ask for help when a transfer is over 50 / 100 / 200 EUR": a larger amount becomes a request; an amount up to the limit is sent directly.

## What is mocked

- **Payment**: no real money moves. `sendTransfer()` in `server/payments/` waits about a second, logs `[MOCK PAYMENT]` and returns a fake id.
- **Exchange rates and fees**: a fixed table in `server/payments/rates.mock.js`.
- **Login**: none. The person is chosen by the URL.
- **Directory**: three seeded people the owner can find by email, phone number or Wisetag:

  | Name | Email | Phone | Wisetag |
  | --- | --- | --- | --- |
  | Mari Tamm | `mari.tamm@example.com` | `+372 5550 1234` | `@maritamm` |
  | Jaan Kask | `jaan.kask@example.com` | `+372 5550 5678` | `@jaankask` |
  | Liis Saar | `liis.saar@example.com` | `+372 5550 9012` | `@liissaar` |

- **Home page**: the second balance and the activity rows are made up. Tiiu's EUR balance is real and drops after a transfer.

## Demo script 1: a guided transfer (60 seconds)

Before you start: on `/demo` tap **Reset: Mari already added**. Owner window on the left, helper window on the right.

| Time | Window | Do | Say |
| --- | --- | --- | --- |
| 0:00 | Left | Show Tiiu's home page. | "Tiiu needs to pay her rent, but she is not comfortable filling in a transfer herself." |
| 0:05 | Left | **1.** Open **Guided Transfers**, tap **Prepare it for me**, type `Rent for December`, tap **Ask Mari**. | "So she asks Mari, someone in her family she trusts, to prepare it." |
| 0:12 | Right | **2.** The green notification appears. Tap it. | "Mari is told straight away." |
| 0:16 | Right | **3.** Type `250`, **Continue**. Name `John Landlord`, IBAN `EE38 2200 2210 2014 5685`, **Continue**. | "She fills it in like any Wise transfer: amount, fee, recipient." |
| 0:30 | Right | **4.** Write `Rent for December to your landlord`. | "And she describes it the way she would say it to Tiiu." |
| 0:36 | Right | **5.** Tap **Send for approval**. Point at "Waiting for Tiiu to confirm". | "Mari cannot send the money. There is no button for it, and the server has no such route for her." |
| 0:40 | Left | **6.** The notification appears. Tap it. | "Tiiu is told it is ready." |
| 0:44 | Left | **7–8.** Scroll the details: description, recipient, IBAN, amount, fee, total, arrival. Tap **Approve**. | "She sees everything, in plain words, and who prepared it." |
| 0:50 | Left | **9.** Point at the three large facts. Tap **Confirm and send**. | "One last check with only what matters: what for, who, how much. Only she can confirm." |
| 0:55 | Both | **10–11.** Both windows show the transfer as sent. Open Tiiu's **Home**: 1,240.50 becomes 990.15 EUR. | "The money is sent and both of them know. Tiiu stayed in control the whole time." |

If you have more time:

- **Decline**: at step 8 tap **Decline** and pick a reason. Mari sees the reason in plain words.
- **Cancel**: after step 5 tap **Cancel transfer** in Mari's window. Tiiu is told and can no longer confirm it.
- **Failure**: use a recipient name that contains `FAIL`, or an amount above the balance such as `5000`. Both sides are told the money was not sent.

## Demo script 2: adding a helper (60 seconds)

Before you start: on `/demo` tap **Reset: no helper yet**. Owner window on the left, helper window on the right.

| Time | Window | Do | Say |
| --- | --- | --- | --- |
| 0:00 | Left | Open **Helper**. Tap **Add a helper**. | "Before anyone can help, Tiiu has to choose them herself." |
| 0:06 | Left | Read the rights text. Tap **I understand**. | "She is told in plain language what a helper can and cannot do. A helper can never send money." |
| 0:14 | Left | Tap **100 EUR**. | "She decides when she wants help: with every transfer, or only above an amount." |
| 0:20 | Left | Type `@maritamm`, tap **Find**. Tap **Send invite**. | "She finds Mari by email, phone or Wisetag, checks it is the right person, and invites her." |
| 0:30 | Left | Point at the "Invited" label. | "Nothing has changed yet. Mari has to say yes." |
| 0:33 | Right | The notification and the Invitations card appear. Point at the rights text. Tap **Accept**. | "Mari sees who is asking and exactly the same rules." |
| 0:40 | Left | The label turns to "Active" by itself. | "Tiiu sees it straight away." |
| 0:43 | Left | **Home** → **Send money** → `30` → name `John Landlord`, IBAN `EE38 2200 2210 2014 5685` → **Send**. | "A small transfer she sends on her own. Mari never sees it." |
| 0:52 | Left | **Home** → **Send money** → `250` → **Continue**. | "A larger one is not sent. It goes to Mari to prepare, and Tiiu will still confirm it herself." |
| 0:57 | Right | The request appears with 250 filled in. | "Mari picks it up from here." |

If you have more time:

- **Change the setting**: Left, **Helper** → **Change this** → **Help me with every transfer**. Now every Send money goes to Mari.
- **Remove helper**: Left, **Helper** → **Remove helper** → **Yes, remove** while Mari has an unfinished transfer. It is cancelled and Mari is told.
- **Decline the invite**: at 0:33 tap **Decline** instead. Tiiu sees "Declined" and can ask someone else.

## Tests

```bash
npm test
```

24 quick tests that run the real server on a temporary database and check the rules above.

## Team rules

- One person per file.
- Commit before larger AI changes.
- Pull before you start.
