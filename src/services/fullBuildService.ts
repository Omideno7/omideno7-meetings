import { fullBuildModules } from "../config/fullBuildModules";
import { testingPlan } from "../config/testingPlan";
import { releaseReadiness } from "../config/releaseReadiness";

const TESTING_KEY = "omideno7.fullBuild.testing.v30";
const RELEASE_KEY = "omideno7.fullBuild.release.v30";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("omideno7-demo-store-updated"));
  return value;
}

export const fullBuildService = {
  listModules() {
    return fullBuildModules;
  },

  listTestingItems() {
    return read(TESTING_KEY, testingPlan);
  },

  updateTestingItem(id: string, status: "not_tested" | "passed" | "failed" | "needs_fix") {
    const next = this.listTestingItems().map((item: any) =>
      item.id === id ? { ...item, status } : item
    );
    return write(TESTING_KEY, next);
  },

  listReleaseItems() {
    return read(RELEASE_KEY, releaseReadiness);
  },

  updateReleaseItem(title: string, status: string) {
    const next = this.listReleaseItems().map((item: any) =>
      item.title === title ? { ...item, status } : item
    );
    return write(RELEASE_KEY, next);
  },

  getCompletionSummary() {
    const modules = this.listModules();
    const ready = modules.filter((item) => item.status === "ready" || item.status === "prepared").length;
    return {
      total: modules.length,
      ready,
      needsCredentials: modules.filter((item) => item.status === "needs_credentials").length
    };
  }
};
