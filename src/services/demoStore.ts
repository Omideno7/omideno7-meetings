type AccessRequest = {
  id: string;
  fullName: string;
  email: string;
  country: string;
  relationship: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "blocked" | "more_info";
  role?: "approved_member" | "media_servant" | "door_servant" | "senior_host";
  risk: "normal" | "review";
  createdAt: string;
};

type WaitingEntry = {
  id: string;
  name: string;
  role: string;
  status: "waiting" | "admitted" | "rejected";
  device: string;
  requestedAt: string;
};

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  type: "access" | "meeting" | "recording" | "security";
  read: boolean;
  createdAt: string;
};

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

const KEYS = {
  requests: "omideno7.demo.accessRequests.v19",
  waiting: "omideno7.demo.waitingRoom.v19",
  notifications: "omideno7.demo.notifications.v19",
  inbox: "omideno7.demo.inbox.v19",
  checklist: "omideno7.demo.checklist.v19",
  meeting: "omideno7.demo.meetingState.v19"
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): T {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("omideno7-demo-store-updated"));
  return value;
}

const defaultRequests: AccessRequest[] = [
  {
    id: "req-mary",
    fullName: "Mary Smith",
    email: "mary@example.com",
    country: "Croatia",
    relationship: "Church member",
    reason: "I want to join Sunday services.",
    status: "pending",
    risk: "normal",
    createdAt: "2026-06-15 09:00"
  },
  {
    id: "req-david",
    fullName: "David Brown",
    email: "david@example.com",
    country: "Germany",
    relationship: "Servant / Media",
    reason: "I help with media and meetings.",
    status: "pending",
    risk: "review",
    createdAt: "2026-06-15 09:05"
  }
];

const defaultWaiting: WaitingEntry[] = [
  { id: "wait-1", name: "Mary Smith", role: "approved_member", status: "waiting", device: "iPhone", requestedAt: "20:00" },
  { id: "wait-2", name: "David Brown", role: "media_servant", status: "waiting", device: "Android", requestedAt: "20:01" }
];

const defaultNotifications: NotificationItem[] = [
  { id: "not-1", title: "New access request", body: "Mary Smith requested access and is waiting for Owner approval.", type: "access", read: false, createdAt: "Today 09:00" },
  { id: "not-2", title: "Sunday service reminder", body: "Sunday Service is scheduled for 20:00 Europe/Zagreb.", type: "meeting", read: false, createdAt: "Today 08:00" },
  { id: "not-3", title: "Recording ready", body: "A demo recording is ready in Media Library.", type: "recording", read: true, createdAt: "Yesterday" }
];

const defaultInbox = [
  { id: "msg-1", from: "Apostle Yuhana", subject: "Welcome to OmideNo7 Meetings test", body: "This is a demo inbox message. In production, messages will be stored securely in Supabase.", read: false },
  { id: "msg-2", from: "System", subject: "PWA installed successfully", body: "The app is now installed as a test PWA. Live meetings still need backend connection.", read: false }
];

const defaultChecklist: ChecklistItem[] = [
  { id: "build", label: "Build locally", checked: false },
  { id: "https", label: "Deploy to HTTPS", checked: true },
  { id: "manifest", label: "Manifest loads", checked: true },
  { id: "sw", label: "Service worker registers", checked: false },
  { id: "iphone", label: "iPhone Add to Home Screen works", checked: true },
  { id: "android", label: "Android install test pending", checked: false }
];

export const demoStore = {
  listRequests() { return read<AccessRequest[]>(KEYS.requests, defaultRequests); },

  submitRequest(input: Omit<AccessRequest, "id" | "status" | "risk" | "createdAt">) {
    const requests = this.listRequests();
    const request: AccessRequest = {
      ...input,
      id: `req-${Date.now()}`,
      status: "pending",
      risk: input.relationship.toLowerCase().includes("servant") ? "review" : "normal",
      createdAt: new Date().toLocaleString()
    };
    write(KEYS.requests, [request, ...requests]);
    const notifications = this.listNotifications();
    write(KEYS.notifications, [
      { id: `not-${Date.now()}`, title: "New access request", body: `${input.fullName} requested access and is waiting for Owner approval.`, type: "access", read: false, createdAt: "Just now" },
      ...notifications
    ]);
    return request;
  },

  updateRequest(id: string, status: AccessRequest["status"], role?: AccessRequest["role"]) {
    return write(KEYS.requests, this.listRequests().map((item) => item.id === id ? { ...item, status, role: role || item.role } : item));
  },

  listWaitingRoom() { return read<WaitingEntry[]>(KEYS.waiting, defaultWaiting); },
  updateWaiting(id: string, status: WaitingEntry["status"]) {
    return write(KEYS.waiting, this.listWaitingRoom().map((item) => item.id === id ? { ...item, status } : item));
  },
  resetWaitingDemo() { return write(KEYS.waiting, defaultWaiting); },

  listNotifications() { return read<NotificationItem[]>(KEYS.notifications, defaultNotifications); },
  markNotificationRead(id: string) { return write(KEYS.notifications, this.listNotifications().map((item) => item.id === id ? { ...item, read: true } : item)); },
  markAllNotificationsRead() { return write(KEYS.notifications, this.listNotifications().map((item) => ({ ...item, read: true }))); },

  listInbox() { return read(KEYS.inbox, defaultInbox); },
  markInboxRead(id: string) {
    return write(KEYS.inbox, this.listInbox().map((item: any) => item.id === id ? { ...item, read: true } : item));
  },

  getChecklist() { return read<ChecklistItem[]>(KEYS.checklist, defaultChecklist); },
  toggleChecklist(id: string) { return write(KEYS.checklist, this.getChecklist().map((item) => item.id === id ? { ...item, checked: !item.checked } : item)); },

  getMeetingState() {
    return read(KEYS.meeting, { mic: false, camera: false, speaker: "speaker", lowBandwidth: false, lectureMode: false, recording: false, joined: true } as Record<string, any>);
  },
  setMeetingState(patch: Record<string, any>) { return write(KEYS.meeting, { ...this.getMeetingState(), ...patch }); }
};
