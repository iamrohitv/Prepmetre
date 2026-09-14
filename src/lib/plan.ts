import plansFile from "@/data/plans.json";

export type Subject = {
  id: string;
  label: string;
};

export type WeekTopics = {
  week: number;
  topics: Record<string, string[]>;
};

export type StudyPlan = {
  id: string;
  title: string;
  subtitle: string;
  totalDays: number;
  subjects: Subject[];
  weeks: WeekTopics[];
};

export type Chapter = {
  id: string;
  day: number;
  week: number;
  subject: string;
  subjectLabel: string;
  name: string;
};

export type StudyDay = {
  day: number;
  week: number;
  dayInWeek: number;
  chapters: Chapter[];
};

export const plans: StudyPlan[] = (plansFile as { plans: StudyPlan[] }).plans;

export function getPlan(id: string): StudyPlan {
  return plans.find((p) => p.id === id) ?? plans[0];
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const SUBJECT_ORDER = ["maths", "reasoning", "english", "ga", "python", "math", "ml"];

function subjectRank(subject: string): number {
  const i = SUBJECT_ORDER.indexOf(subject);
  return i === -1 ? 99 : i;
}

export function buildDays(plan: StudyPlan): StudyDay[] {
  const days: StudyDay[] = [];
  let dayCounter = 1;

  for (const w of plan.weeks) {
    const topics: Array<{ subject: string; name: string }> = [];
    for (const subject of plan.subjects) {
      const names = w.topics[subject.id] ?? [];
      for (const name of names) topics.push({ subject: subject.id, name });
    }

    const weekDays: StudyDay[] = Array.from({ length: 7 }, (_, i) => ({
      day: dayCounter + i,
      week: w.week,
      dayInWeek: i + 1,
      chapters: [],
    }));

    topics.forEach((t, idx) => {
      const dIdx = idx % 7;
      const subjectLabel =
        plan.subjects.find((s) => s.id === t.subject)?.label ?? t.subject;
      const id = `${plan.id}-w${w.week}d${weekDays[dIdx].day}-${t.subject}-${slug(t.name)}`;
      weekDays[dIdx].chapters.push({
        ...t,
        id,
        day: weekDays[dIdx].day,
        week: w.week,
        subjectLabel,
      });
    });

    for (const d of weekDays) {
      d.chapters.sort(
        (a, b) =>
          subjectRank(a.subject) - subjectRank(b.subject) ||
          a.name.localeCompare(b.name),
      );
    }

    days.push(...weekDays);
    dayCounter += 7;
  }

  return days;
}

export function allChapters(days: StudyDay[]): Chapter[] {
  return days.flatMap((d) => d.chapters);
}

export function startOfToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function calcTodayDay(startISO: string | null, totalDays: number): number {
  if (!startISO) return 1;
  const start = new Date(`${startISO}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  const day = diff + 1;
  if (day < 1) return 1;
  if (day > totalDays) return totalDays;
  return day;
}

export function orderDaysForTrack(days: StudyDay[], todayDay: number): StudyDay[] {
  const today = days.filter((d) => d.day === todayDay);
  const upcoming = days.filter((d) => d.day > todayDay).sort((a, b) => a.day - b.day);
  const past = days.filter((d) => d.day < todayDay).sort((a, b) => b.day - a.day);
  return [...today, ...upcoming, ...past];
}

export type DayStatus = "done" | "partial" | "todo" | "empty";

export function dayStatus(
  day: StudyDay,
  checked: Record<string, boolean>,
): DayStatus {
  if (day.chapters.length === 0) return "empty";
  const done = day.chapters.filter((c) => checked[c.id]).length;
  if (done === day.chapters.length) return "done";
  if (done > 0) return "partial";
  return "todo";
}
