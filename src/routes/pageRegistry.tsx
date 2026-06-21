import type { ComponentType } from "react";
import type { AppRouteKey } from "../types/routes";

import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RequestAccessPage } from "../pages/RequestAccessPage";
import { PendingApprovalPage } from "../pages/PendingApprovalPage";
import { MemberHomePage } from "../pages/MemberHomePage";
import { OwnerDashboardPage } from "../pages/OwnerDashboardPage";
import { ApprovalsPage } from "../pages/ApprovalsPage";
import { ServantDashboardPage } from "../pages/ServantDashboardPage";
import { PermissionTemplatesPage } from "../pages/PermissionTemplatesPage";
import { MeetingSchedulePage } from "../pages/MeetingSchedulePage";
import { DeviceTestPage } from "../pages/DeviceTestPage";
import { WaitingRoomPage } from "../pages/WaitingRoomPage";
import { LiveMeetingPage } from "../pages/LiveMeetingPage";
import { SecurityCenterPage } from "../pages/SecurityCenterPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { SystemSetupPage } from "../pages/SystemSetupPage";
import { BackendSetupPage } from "../pages/BackendSetupPage";
import { InstallAppPage } from "../pages/InstallAppPage";
import { FullBuildOverviewPage } from "../pages/FullBuildOverviewPage";
import { TestingCenterPage } from "../pages/TestingCenterPage";
import { ReleaseReadinessPage } from "../pages/ReleaseReadinessPage";
import { LegalPagesSetupPage } from "../pages/LegalPagesSetupPage";

import {
  NotificationsPage,
  InboxPage,
  MediaLibraryPage,
  ReportsPage,
  LiveKitSetupPage,
  ProductionRoadmapPage,
  PrototypeAuditPage,
  SecurityTestPlanPage,
  DeployTestPage
} from "../pages/SimplePages";

export const pageRegistry: Record<AppRouteKey, ComponentType> = {
  landing: LandingPage,
  login: LoginPage,
  requestAccess: RequestAccessPage,
  pendingApproval: PendingApprovalPage,
  memberHome: MemberHomePage,
  ownerDashboard: OwnerDashboardPage,
  approvals: ApprovalsPage,
  servantDashboard: ServantDashboardPage,
  permissionTemplates: PermissionTemplatesPage,
  meetingSchedule: MeetingSchedulePage,
  deviceTest: DeviceTestPage,
  waitingRoom: WaitingRoomPage,
  liveMeeting: LiveMeetingPage,
  securityCenter: SecurityCenterPage,
  auditLogs: AuditLogsPage,
  notifications: NotificationsPage,
  inbox: InboxPage,
  mediaLibrary: MediaLibraryPage,
  reports: ReportsPage,
  systemSetup: SystemSetupPage,
  backendSetup: BackendSetupPage,
  liveKitSetup: LiveKitSetupPage,
  productionRoadmap: ProductionRoadmapPage,
  prototypeAudit: PrototypeAuditPage,
  securityTestPlan: SecurityTestPlanPage,
  installApp: InstallAppPage,
  deployTest: DeployTestPage,
  fullBuildOverview: FullBuildOverviewPage,
  testingCenter: TestingCenterPage,
  releaseReadiness: ReleaseReadinessPage,
  legalPagesSetup: LegalPagesSetupPage
};
