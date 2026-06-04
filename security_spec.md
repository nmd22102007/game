# Hardened Security Specification: NURMD Game Hub

This document defines the strict data invariants, security boundaries, and validation rules for the 6 core collections in NURMD Games.

---

## 1. Core Data Invariants

### Users Collection (`/users/{uid}`)
1. **Scope/Ownership:** A user document is strictly readable by any signed-in user (or private to owner only based on application needs, but since rankings/usernames are shared, usernames must be visible, or we split. Wait! The prompt says "Users can read/write only their own profile" for profile collection, and "Leaderboards are publicly readable but writable only by authenticated users").
2. **Strict Matching:** The user's credential path `uid` must exactly equal `request.auth.uid`.
3. **Property Bounds:** Schema must strictly match:
   - `uid` is string matching auth uid.
   - `username` is string (1 to 32 chars).
   - `email` is string.
   - `avatar` matches valid IDs.
   - `coins` is a positive integer.
   - `totalScore` is a positive integer.
   - `achievements` is an array of strings.
   - `createdAt` is a Server Timestamp.

### Leaderboards Collection (`/leaderboards/{entryId}`)
1. **Scope/Ownership:** Publicly readable. Writable only if authenticated, where:
   - `uid` from payload matches `request.auth.uid`.
2. **Type Bounds:** `score` matches `int` and is positive.

### Achievements / Game Progress / Skins / Settings Collections
1. **Scope/Ownership:** Only the user can view and edit their own documents in `/achievements/{uid}`, `/gameProgress/{uid}`, `/skins/{uid}`, and `/settings/{uid}`.

---

## 2. Adversarial Payloads & Target Defense

| Payload ID | Description / Threat Vector | Target Path | Malicious Concept / Expected Result |
|------------|-----------------------------|-------------|-------------------------------------|
| **PL-01**  | Profile Spoofing           | `/users/{uid}` | Update another user's profile coins/totalScore directly. -> `PERMISSION_DENIED` |
| **PL-02**  | Admin Flag Manipulation     | `/users/{uid}` | Inject self-escalated roles like `isAdmin: true` into own profile. -> `PERMISSION_DENIED` |
| **PL-03**  | Coin Hack                  | `/users/{uid}` | Directly add 999999 coins using client script. -> `PERMISSION_DENIED` |
| **PL-04**  | Score Overwrite            | `/leaderboards/{entryId}` | Post fake low score to other users’ entries. -> `PERMISSION_DENIED` |
| **PL-05**  | Rogue Skin Injections      | `/skins/{uid}` | Unlock all Premium content directly in Firestore. -> `PERMISSION_DENIED` |
| **PL-06**  | Settings Hijacking         | `/settings/{uid}` | Edit other user's game sound levels. -> `PERMISSION_DENIED` |
| **PL-07**  | Date Spoofing              | `/users/{uid}` | Backdate `createdAt` to gain early access. -> `PERMISSION_DENIED` |
| **PL-08**  | High Score Falsification   | `/leaderboards/{id}` | Post scores greater than allowed limits or negative. -> `PERMISSION_DENIED` |
| **PL-09**  | Invalid JSON Map Payload   | `/gameProgress/{uid}` | Send empty or incorrect nested objects. -> `PERMISSION_DENIED` |
| **PL-10**  | Read Scraping              | `/users` | Run listing queries across other private fields. -> `PERMISSION_DENIED` |
| **PL-11**  | Path Variable Injection    | `/settings/{uid}` | Send settings UID of 1.5KB junk-character string. -> `PERMISSION_DENIED` |
| **PL-12**  | Orphaned Key Overwrites    | `/achievements/{uid}` | Set unearned achievements with missing array keys. -> `PERMISSION_DENIED` |
