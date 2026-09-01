# Raw data manifest

Provenance only. No schemas, no build guidance.

## linkedin-export/
LinkedIn full-account data export for Jacob Kantor (linkedin.com/in/thejacobkantor),
generated 2026-08-04. Files are unmodified from the export.

- Connections.csv — ~21,446 first-degree connections (name, profile URL, company, position, connect date). Note: LinkedIn prepends a 3-line notice before the header row.
- messages.csv — full message history, ~126k rows. **Contains complete private message content from and to other people.** Columns include sender/recipient names and profile URLs, timestamps, folder.
- Comments_51242046.csv — Jacob's own comments (date, post URL, comment text). No counterparty column; LinkedIn flattens @-mentions into plain text.
- Shares_51242046.csv — Jacob's posts/shares.
- Reactions_51242046.csv — Jacob's reactions to others' posts.
- Invitations.csv — sent/received connection invitations with profile URLs.
- Endorsement_Given_Info.csv / Endorsement_Received_Info.csv — skill endorsements.
- Recommendations_Given.csv / Recommendations_Received.csv — written recommendations.
- Events.csv — LinkedIn events attended/hosted.
- Profile.csv / Profile Summary.csv / Positions.csv — Jacob's own profile and work history.

## roster/
Jacob's hand-curated working contact sheet ("Cleaned up DODO DOJO HITLIST ver. 2"),
exported as three tabs. His own categorization and notes, unmodified.

- Contacts.csv — 672 people.
- Organizations.csv — 453 organizations.
- Others.csv — 144 rows parked during a cleanup pass, with a reason per row.

## voice-and-context/
The only records of Jacob's spoken judgment and business context.
Both files mix primary source (what Jacob said) with a prior analyst's
commentary and proposals — they are NOT clean raw data. Kept because the
primary-source content exists nowhere else; the raw audio/transcript was
not preserved.

- jacob onboarding.md — record of the founding conversation about his business.
- voice-pass-1-findings.md — extraction from his one recorded voice pass (~27 contacts discussed), with the analyst's notes.

## Sensitivity
This folder identifies real public-education officials and includes private
message content and Jacob's candid notes about named people. Handle accordingly;
do not publish, commit to a public repository, or share beyond the project.
