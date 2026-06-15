import type { Meeting } from "../types/meetings";

export const mockMeetings: Meeting[] = [
  {
    id: "sunday-service",
    title: "Sunday Service",
    mode: "sermon",
    startsAt: "Sunday 20:00 Europe/Zagreb",
    status: "scheduled"
  },
  {
    id: "morning-prayer",
    title: "Morning Prayer",
    mode: "prayer",
    startsAt: "Daily 05:00 Europe/Zagreb",
    status: "scheduled"
  }
];
