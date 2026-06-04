# Security Specification: NURMD Game Hub Firestore Rules

This document outlines the security invariants, the "Dirty Dozen" malicious payloads, and the validation criteria for securing Firestore data in NURMD Game Hub.

## 1. Core Data Invariants

### Profiles Collection (`/profiles/{userId}`)
1. **Scope/Ownership:** A user document is strictly writable and readable only by the authenticated owner (`request.auth.uid == userId`).
2. **Immutability:** Once created, critical metadata fields such as the original profile owner must remain immutable.
3. **Validation:** Up-to-date and compliant with schema specs (contains valid `username`, `avatarId`, `coins`, and stats).

### Leaderboards Collection (`/leaderboard/{entryId}`)
1. **Integrity:** A user can insert or modify their own leaderboard entry but must not write under someone else's identity.
2. **Value Bounds:** Scores and date strings must have strict type matching and length containment to defend against overflow/Denial-of-Wallet attacks.

---

## 2. The "Dirty Dozen" Adversarial Payloads

Any attempt to commit these payloads must result in standard `PERMISSION_DENIED` rejection.

| Payload ID | Description / Threat Vector | Target Collection | Malicious Payload Concept |
|------------|-----------------------------|-------------------|---------------------------|
| **PL-01**  | Identity Spoofing (Create profile with foreign UID) | `/profiles/{userId}` | Write a profile for `victim_uid` using token `attacker_uid`. |
| **PL-02**  | Identity Spoofing (Read other user's private data) | `/profiles/{userId}` | Read `/profiles/victim_uid` with token `attacker_uid`. |
| **PL-03**  | Coin Hack (Inject massive coins injection) | `/profiles/{userId}` | Update `coins: 9999999` directly via the client SDK. |
| **PL-04**  | Achievement Hack (Self-unlock all achievements) | `/profiles/{userId}` | Ingest predefined achievements with `unlocked: true` of expensive titles without merit. |
| **PL-05**  | Rogue Skin Unlock (Force unlock premium unbought items) | `/profiles/{userId}` | Set unearned skins to `unlocked: true` directly. |
| **PL-06**  | ID Poisoning (Junk character buffer overrun) | `/leaderboard/{entryId}` | Use an entry ID of 10,000 junk bytes. |
| **PL-07**  | Leaderboard Identity Spoofing | `/leaderboard/{entryId}` | Set `userId` to a target friend's ID while posting a high score. |
| **PL-08**  | High Score Falsification (Negative score bounds bypass) | `/leaderboard/{entryId}` | Set `score: -99999` to corrupt leaderboard integrity. |
| **PL-09**  | Value Poisoning (Send string array for score) | `/leaderboard/{entryId}` | Put a long array of strings in the `score` field to crash d3 graphs. |
| **PL-10**  | System Operational State Denial (Delete Leaderboard Feed) | `/leaderboard/{entryId}` | Call delete on arbitrary entries you did not author. |
| **PL-11**  | Blanket Read Attack (Scraping profiles list) | `/profiles` | Run listing search without user-bound where constraints. |
| **PL-12**  | Time Drift Spoofing (Cheat creation dates) | `/profiles/{userId}` | Backdate the `createdAt` or `updatedAt` field using spoofed client value instead of `request.time`. |

---

## 3. Test Runner Design Verified

Our rules are structured with a Zero-Trust master-gate architecture ensuring that these vectors are defensively isolated. Let us proceed to generate our rules now.
