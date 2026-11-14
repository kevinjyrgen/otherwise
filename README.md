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

Three things make it easier still:

- **Pay a bill from a photo**: in Guided Transfers the owner taps **I have a bill to pay** and takes a photo of the bill. She types nothing. The helper reads the details off the photo, and the owner sees the same photo again when she checks the transfer.
- **Regular payments** (owner's **Payments**): on the last step the helper can choose **Every month** and a day. The owner approves it once, together with the first payment. After that it goes out by itself. She is told the day before and can skip a month or stop it.
- **Saved recipients** (owner's **Recipients**): after money was sent, the owner can save the recipient with one tap. Next time she picks the name and types only the amount.

## Reset the demo

There are two starting points, as buttons on `/demo`:

- **Reset: no helper yet**: to show adding a helper.
- **Reset: Mari already added**: to show a transfer. Mari is the active helper and Tiiu gets help when a transfer is over 100 EUR.

From the terminal:

```bash
npm run reset
```

This is the same as "Mari already added". Both ways put the balance back to 1,240.50 EUR, remove all transfers, notifications, bill photos, saved recipients and regular payments, and put the demo date back to today. They work while the app is running; open windows update by themselves.

## Move the date

Regular payments run on the demo's own calendar, so a month can pass during a presentation. Two buttons on `/demo`:

- **Jump to the day before the next payment**: Tiiu gets "goes out tomorrow" and can still skip it.
- **Go to the next day**: on the payment day the money goes out.

Without the buttons the calendar follows the real date.

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

Bill photo:

- Only the owner can attach a photo, and only when she asks for a transfer. It must really be a picture (JPEG, PNG or WebP, up to 4 MB).
- Only the two people of that transfer can open it: the owner and the helper she asked.

Regular payments:

- A regular payment starts in one way only: the helper marks a transfer "every month" (day 1 to 28) and the owner confirms it. If she declines, or the first payment fails, nothing regular starts.
- From then on it is the owner's alone. Only she can skip the next payment or stop it. The helper has no route for it and does not see the monthly payments.
- The owner is told the day before each payment. A payment that cannot be paid fails that month and is tried again the next month.
- Removing the helper does not stop a regular payment.

Saved recipients:

- Only the owner can save a recipient, and only from a transfer that was sent. Name and account number are copied from that transfer, never typed. The helper cannot add to the list or see it.
- A saved recipient does not get around the help setting. Over her limit the transfer still goes to her helper, with the recipient already filled in.

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

- **Sample bill**: `public/sample-bill.png`, a made-up electricity bill. On the bill screen tap **No bill at hand? Use a sample bill**.
- **Date**: regular payments use the demo calendar, see "Move the date".
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

## Demo script 3: a bill, every month, and next time on her own (90 seconds)

Before you start: on `/demo` tap **Reset: Mari already added**. Owner window on the left, helper window on the right, `/demo` in a third tab.

| Time | Window | Do | Say |
| --- | --- | --- | --- |
| 0:00 | Left | Open **Guided Transfers**, tap **I have a bill to pay**. | "Tiiu got her electricity bill. Typing an account number and a reference is the hardest part for her." |
| 0:06 | Left | Tap **Take a photo of the bill** (or **Use a sample bill**). Tap **Send to Mari**. | "So she does not type. She takes a photo and sends it to Mari." |
| 0:14 | Right | The notification appears. Tap it. Point at the photo. | "Mari gets the bill itself, not a description of it." |
| 0:20 | Right | Type `48.90`, **Continue**. Name `Northside Electricity Ltd`, IBAN `EE94 7700 7710 0234 5678`, reference `2026110457`, **Continue**. | "She fills it in from the photo." |
| 0:35 | Right | Write `Your electricity bill`. Tap **Every month**, choose the **20th**. Tap **Send for approval**. | "This bill comes every month, so Mari sets it up as a regular payment. She still cannot send anything." |
| 0:45 | Left | Tap the notification. Point at the photo, then at "This is a regular payment". Tap **Approve**. | "Tiiu sees her own photo next to what Mari entered, and she is told clearly that it repeats." |
| 0:55 | Left | Point at "Now, and then every month on the 20th". Tap **Confirm and send**. | "She approves it once. Only she can." |
| 1:02 | Left | Tap **Save Northside Electricity Ltd**. | "And she saves the recipient with one tap." |
| 1:08 | `/demo` | Tap **Jump to the day before the next payment**. | "A month later." |
| 1:12 | Left | The notification appears. Tap it, point at **Skip the next one**. | "The day before, Tiiu is told, and she can skip it or stop it. Mari cannot, and she does not see these payments." |
| 1:20 | `/demo`, Left | Tap **Go to the next day**. Open Tiiu's **Home**. | "The bill is paid. Nobody typed anything this month." |

If you have more time:

- **Pay a saved recipient**: Left, **Recipients** → **Send money** → `30` → **Send**. No account number to type.
- **Over the limit**: the same with `250`. It is not sent. Mari gets the request with the recipient already filled in.
- **Stop it**: Left, **Payments** → **Stop this payment** → **Yes, stop it**.

## Tests

```bash
npm test
```

36 quick tests that run the real server on a temporary database and check the rules above.

## Team rules

- One person per file.
- Commit before larger AI changes.
- Pull before you start.
