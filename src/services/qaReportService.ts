export type QaIssue = {
  id: string;
  createdAt: string;
  reporter: string;
  area: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  steps: string;
  expected: string;
  actual: string;
  status: "open" | "fixed" | "review";
};

const STORAGE_KEY = "omideno7.qa.issues.v1";

function read(): QaIssue[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as QaIssue[];
  } catch {
    return [];
  }
}

function write(items: QaIssue[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const qaReportService = {
  list(): QaIssue[] {
    return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  add(input: Omit<QaIssue, "id" | "createdAt" | "status">) {
    const issue: QaIssue = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "open",
      ...input
    };
    write([issue, ...read()]);
    return issue;
  },

  updateStatus(id: string, status: QaIssue["status"]) {
    const next = read().map((item) => item.id === id ? { ...item, status } : item);
    write(next);
    return next;
  },

  remove(id: string) {
    const next = read().filter((item) => item.id !== id);
    write(next);
    return next;
  },

  clear() {
    write([]);
  },

  exportJson() {
    return JSON.stringify(read(), null, 2);
  },

  exportText() {
    const items = read();
    if (!items.length) return "No QA issues recorded yet.";
    return items.map((item, index) => [
      `#${index + 1} ${item.title}`,
      `Area: ${item.area}`,
      `Severity: ${item.severity}`,
      `Status: ${item.status}`,
      `Reporter: ${item.reporter}`,
      `Created: ${item.createdAt}`,
      `Steps: ${item.steps || "-"}`,
      `Expected: ${item.expected || "-"}`,
      `Actual: ${item.actual || "-"}`
    ].join("\n")).join("\n\n---\n\n");
  }
};
