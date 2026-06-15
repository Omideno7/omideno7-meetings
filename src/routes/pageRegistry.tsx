import { LegalPagesSetupPage } from "../pages/LegalPagesSetupPage";
import { ReleaseReadinessPage } from "../pages/ReleaseReadinessPage";
import { TestingCenterPage } from "../pages/TestingCenterPage";
import { FullBuildOverviewPage } from "../pages/FullBuildOverviewPage";
import { BackendSetupPage } from "../pages/BackendSetupPage";
import type { AppRouteKey } from "../types/routes";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RequestAccessPage } from "../pages/RequestAccessPage";
import { PendingApprovalPage } from "../pages/PendingApprovalPage";
import { MemberHomePage } from "../pages/MemberHomePage";
import { OwnerDashboardPage } from "../pages/OwnerDashboardPage";
import { ApprovalsPage } from "../pages/ApprovalsPage";
import { WaitingRoomPage } from "../pages/WaitingRoomPage";
import { LiveMeetingPage } from "../pages/LiveMeetingPage";
import { SystemSetupPage } from "../pages/SystemSetupPage";
import { InstallAppPage } from "../pages/InstallAppPage";
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

export const pageRegistry: Record<AppRouteKey, React.ComponentType> = {
  landing: LandingPage,
  login: LoginPage,
  requestAccess: RequestAccessPage,
  pendingApproval: PendingApprovalPage,
  memberHome: MemberHomePage,
  ownerDashboard: OwnerDashboardPage,
  approvals: ApprovalsPage,
  waitingRoom: WaitingRoomPage,
  liveMeeting: LiveMeetingPage,
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
  deployTest: DeployTestPage
  fullBuildOverview: FullBuildOverviewPage,
  testingCenter: TestingCenterPage,
  releaseReadiness: ReleaseReadinessPage,
  legalPagesSetup: LegalPagesSetupPage,
};
