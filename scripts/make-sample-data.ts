/**
 * Generate a sample roster + matching sample certificates, for testing the
 * certificates page end to end before real student data exists.
 *
 *   npx tsx scripts/make-sample-data.ts
 *
 * Writes:
 *   sample-roster.csv              — same shape as the real sheet's CSV export
 *   sample-certificates/{wks}/{uid}.svg
 *
 * Both are gitignored. SVG is used rather than PNG so the files can be produced
 * with no image library and still carry real text — import with `--ext svg`.
 *
 * Access codes are NOT generated here — the import script issues them and writes
 * new-access-codes.csv. Run the import, then read that file for the codes.
 *
 * The roster deliberately covers every UI state. UID 1 alone exercises all
 * three: a free physical copy, a chargeable one, and a not-attended workshop.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { WORKSHOPS } from "../lib/certificates";

interface SampleStudent {
  uid: string;
  name: string;
  college: string;
  phone: string;
  email: string;
  /** Per workshop, in WORKSHOPS order: [attended, received] */
  marks: [boolean, boolean][];
}

const A = true;
const N = false;

const STUDENTS: SampleStudent[] = [
  // attended+unreceived (free), attended+received (chargeable), absent
  { uid: "1", name: "Aarav Sharma", college: "RAIT", phone: "9820000121", email: "aarav@example.com",  marks: [[A, N], [A, A], [N, N]] },
  { uid: "2", name: "Diya Patel",   college: "RAIT", phone: "9820000122", email: "diya@example.com",   marks: [[A, A], [A, A], [A, N]] },
  // attended nothing — every card should be the muted "not attended" state
  { uid: "3", name: "Kabir Nair",   college: "RAIT", phone: "9820000123", email: "kabir@example.com",  marks: [[N, N], [N, N], [N, N]] },
  { uid: "4", name: "Ishita Rao",   college: "RAIT", phone: "9820000124", email: "ishita@example.com", marks: [[A, N], [N, N], [A, N]] },
  { uid: "5", name: "Vivaan Joshi", college: "RAIT", phone: "9820000125", email: "vivaan@example.com", marks: [[N, N], [A, N], [A, A]] },
  { uid: "6", name: "Ananya Iyer",  college: "RAIT", phone: "9820000126", email: "ananya@example.com", marks: [[A, N], [A, N], [A, N]] },
  // Real deliverable address, for testing the mailer end to end. Covers all
  // three card states: free physical, chargeable physical, and not attended.
  { uid: "7", name: "Avanish Wankhede", college: "RAIT", phone: "9820000127", email: "avanishwankhede@gmail.com", marks: [[A, N], [A, A], [N, N]] },
];

const xml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function certificateSvg(student: SampleStudent, title: string, date: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
  <rect width="1600" height="1100" fill="#0B0F14"/>
  <rect x="40" y="40" width="1520" height="1020" fill="none" stroke="#00E5FF" stroke-width="3" opacity="0.55"/>
  <rect x="58" y="58" width="1484" height="984" fill="none" stroke="#00E5FF" stroke-width="1" opacity="0.25"/>

  <text x="800" y="180" font-family="monospace" font-size="26" letter-spacing="10"
        fill="#00E5FF" text-anchor="middle">ISA RAIT STUDENT CHAPTER</text>
  <text x="800" y="290" font-family="monospace" font-size="62" font-weight="bold"
        fill="#F2F5F7" text-anchor="middle">CERTIFICATE OF PARTICIPATION</text>
  <line x1="560" y1="330" x2="1040" y2="330" stroke="#00E5FF" stroke-width="2" opacity="0.6"/>

  <text x="800" y="430" font-family="monospace" font-size="24"
        fill="#8FA3AD" text-anchor="middle">This is to certify that</text>
  <text x="800" y="530" font-family="monospace" font-size="66" font-weight="bold"
        fill="#00E5FF" text-anchor="middle">${xml(student.name)}</text>
  <text x="800" y="590" font-family="monospace" font-size="22"
        fill="#8FA3AD" text-anchor="middle">UID ${xml(student.uid)} &#183; ${xml(student.college)}</text>

  <text x="800" y="680" font-family="monospace" font-size="24"
        fill="#8FA3AD" text-anchor="middle">has successfully participated in</text>
  <text x="800" y="760" font-family="monospace" font-size="44" font-weight="bold"
        fill="#F2F5F7" text-anchor="middle">${xml(title)}</text>
  <text x="800" y="815" font-family="monospace" font-size="24"
        fill="#8FA3AD" text-anchor="middle">${xml(prettyDate(date))}</text>

  <line x1="220" y1="940" x2="560" y2="940" stroke="#8FA3AD" stroke-width="1"/>
  <text x="390" y="975" font-family="monospace" font-size="20"
        fill="#8FA3AD" text-anchor="middle">Chairperson</text>
  <line x1="1040" y1="940" x2="1380" y2="940" stroke="#8FA3AD" stroke-width="1"/>
  <text x="1210" y="975" font-family="monospace" font-size="20"
        fill="#8FA3AD" text-anchor="middle">Faculty Advisor</text>

  <text x="800" y="1030" font-family="monospace" font-size="18"
        fill="#5A6B75" text-anchor="middle" opacity="0.8">SAMPLE &#183; NOT A REAL CERTIFICATE</text>
</svg>
`;
}

function main() {
  const root = process.cwd();

  // --- roster CSV: two-row merged header, exactly like the sheet export -----
  const groupRow = ["UID", "Name", "College", "Phone", "Email"];
  const subRow = ["", "", "", "", ""];
  for (const workshop of WORKSHOPS) {
    const label = workshop.sheetLabel ?? `WKS ${/(\d+)/.exec(workshop.id)?.[1] ?? workshop.id}`;
    groupRow.push(label, "");
    subRow.push("Attended?", "Received?");
  }

  const lines = [groupRow.join(","), subRow.join(",")];
  for (const student of STUDENTS) {
    const cells = [student.uid, student.name, student.college, student.phone, student.email];
    for (let i = 0; i < WORKSHOPS.length; i++) {
      const [attended, received] = student.marks[i] ?? [N, N];
      cells.push(attended ? "TRUE" : "FALSE", received ? "TRUE" : "FALSE");
    }
    lines.push(cells.join(","));
  }

  const csvPath = resolve(root, "sample-roster.csv");
  writeFileSync(csvPath, lines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${csvPath} (${STUDENTS.length} students, ${WORKSHOPS.length} workshops)`);

  // --- certificates, one per attended pair ---------------------------------
  let count = 0;
  for (const student of STUDENTS) {
    WORKSHOPS.forEach((workshop, i) => {
      const [attended] = student.marks[i] ?? [N, N];
      if (!attended) return; // absentees get no image, same as production

      const file = resolve(root, "sample-certificates", workshop.id, `${student.uid}.svg`);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, certificateSvg(student, workshop.title, workshop.date), "utf8");
      count++;
    });
  }
  console.log(`Wrote ${count} certificate(s) under sample-certificates/`);

  console.log(`
Next:
  1. Upload the CONTENTS of sample-certificates/ to your R2 bucket, keeping the
     folder names (${WORKSHOPS.map((w) => `${w.id}/`).join(", ")}).
  2. npx tsx scripts/import-roster.ts sample-roster.csv --ext svg
     -> issues access codes and writes new-access-codes.csv
  3. npm run dev  ->  http://localhost:3000/certificates
     Log in as UID 1 with its code from new-access-codes.csv — that student
     covers all three card states.`);
}

main();
