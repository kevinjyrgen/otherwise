# Team OtherWise – Wise Hackathon 2026

**Wise Guided Transfers**: a proposed Wise feature. An account owner who is not confident with apps asks a trusted helper to prepare a money transfer for her. The helper fills it in, the owner checks it and confirms it herself. The helper can never send money.

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
- `/` lets you pick a person. `/owner` is Tiiu, `/helper` is Mari.

For the demo, put two browser windows side by side: `/owner` on the left, `/helper` on the right.

## Reset the demo

```bash
npm run reset
```

Puts the balance back to 1,240.50 EUR and removes all transfers and notifications. Works while the app is running; both windows update by themselves.

## Tests

```bash
npm test
```

Checks the server rules: the helper cannot approve or send, she cannot edit after submitting, the owner's confirmation must match the stored IBAN and amount, a double tap sends once, and the helper never sees the balance.

## What is mocked

- **Payment**: no real money moves. `sendTransfer()` in `server/payments/` waits about a second, logs `[MOCK PAYMENT]` and returns a fake id.
- **Exchange rates and fees**: a fixed table in `server/payments/rates.mock.js`.
- **Login**: none. The person is chosen by the URL.

## 60-second demo script

Before you start: `npm run reset`, owner window on the left, helper window on the right.

| Time | Window | Do | Say |
| --- | --- | --- | --- |
| 0:00 | Left | Show Tiiu's home screen. | "Tiiu needs to pay her rent, but she is not comfortable filling in a transfer herself." |
| 0:05 | Left | **1.** Tap **Prepare it for me**, type `Rent for December`, tap **Ask Mari**. | "So she asks Mari, someone in her family she trusts, to prepare it. One tap." |
| 0:12 | Right | **2.** The green notification appears. Tap it. | "Mari is told straight away." |
| 0:16 | Right | **3.** Type `250`, **Continue**. Name `John Landlord`, IBAN `EE38 2200 2210 2014 5685`, **Continue**. | "She fills it in like any Wise transfer: amount, fee, recipient." |
| 0:30 | Right | **4.** Write `Rent for December to your landlord`. | "And she describes it the way she would say it to Tiiu." |
| 0:36 | Right | **5.** Tap **Send for approval**. Point at "Waiting for Tiiu to confirm". | "Mari cannot send the money. There is no button for it, and the server has no such route for her." |
| 0:40 | Left | **6.** The notification appears. Tap **Look at it**. | "Tiiu is told it is ready." |
| 0:44 | Left | **7–8.** Scroll the details: description, recipient, IBAN, amount, fee, total, arrival. Tap **Approve**. | "She sees everything, in plain words, and who prepared it." |
| 0:50 | Left | **9.** Point at the three large facts. Tap **Confirm and send**. | "One last check with only what matters: what for, who, how much. Only she can confirm." |
| 0:55 | Both | **10–11.** Both windows show the transfer as sent. Go back to Tiiu's home: 1,240.50 becomes 990.15 EUR. | "The money is sent and both of them know. Tiiu stayed in control the whole time." |

If you have more time:

- **Decline**: at step 8 tap **Decline** and pick a reason. Mari sees the reason in plain words.
- **Cancel**: after step 5 tap **Cancel transfer** in Mari's window. Tiiu is told and can no longer confirm it.
- **Failure**: use a recipient name that contains `FAIL`, or an amount above the balance such as `5000`. Both sides are told the money was not sent.

## Team rules

- One person per file.
- Commit before larger AI changes.
- Pull before you start.
