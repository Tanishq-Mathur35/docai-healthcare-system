import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleGuard from "./RoleGuard";

// Auth pages
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";

// Patient pages & layout
import PatientLayout from "../components/layout/PatientLayout";
import PatientDashboard from "../pages/patient/DashboardPage";
import PatientProfile from "../pages/patient/ProfilePage";
import MedicalHistoryPage from "../pages/patient/MedicalHistoryPage";
import DocumentsPage from "../pages/patient/DocumentsPage";
import ConsultationPage from "../pages/patient/ConsultationPage";
import ReportPage from "../pages/patient/ReportPage";
import PatientAppointmentsPage from "../pages/patient/AppointmentsPage";
import PrescriptionsPage from "../pages/patient/PrescriptionsPage";

// Doctor pages & layout
import DoctorLayout from "../components/layout/DoctorLayout";
import DoctorDashboardPage from "../pages/doctor/DashboardPage";
import DoctorPatientsPage from "../pages/doctor/PatientsPage";
import DoctorPatientDetailPage from "../pages/doctor/PatientDetailPage";
import DoctorAppointmentsPage from "../pages/doctor/AppointmentsPage";

// Admin pages & layout
import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboardPage from "../pages/admin/DashboardPage";
import AdminUsersPage from "../pages/admin/UsersPage";
import AdminAnalyticsPage from "../pages/admin/AnalyticsPage";
import AdminAuditLogsPage from "../pages/admin/AuditLogsPage";

// Shared pages
import ChatPage from "../pages/shared/ChatPage";

// Clinical Tools
import TwoMinuteDoctorPage from "../pages/tools/TwoMinuteDoctorPage";
import ReportDecodedPage from "../pages/tools/ReportDecodedPage";
import GoingHomeRightPage from "../pages/tools/GoingHomeRightPage";
import BolKeBataoPage from "../pages/tools/BolKeBataoPage";

// Public pages
import LandingPage from "../pages/public/LandingPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Patient Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard allowedRoles={["PATIENT"]} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="medical-history" element={<MedicalHistoryPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="consultations" element={<ConsultationPage />} />
            <Route path="consultations/new" element={<ConsultationPage />} />
            <Route path="reports/:id" element={<ReportPage />} />
            <Route path="appointments" element={<PatientAppointmentsPage />} />
            <Route path="prescriptions" element={<PrescriptionsPage />} />
            <Route path="two-minute-doctor" element={<TwoMinuteDoctorPage />} />
            <Route path="report-decoded" element={<ReportDecodedPage />} />
            <Route path="going-home-right" element={<GoingHomeRightPage />} />
            <Route path="bol-ke-batao" element={<BolKeBataoPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Route>

      {/* Doctor Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard allowedRoles={["DOCTOR"]} />}>
          <Route path="/doctor" element={<DoctorLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DoctorDashboardPage />} />
            <Route path="patients" element={<DoctorPatientsPage />} />
            <Route path="patients/:id" element={<DoctorPatientDetailPage />} />
            <Route path="appointments" element={<DoctorAppointmentsPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Route>

      {/* Admin Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RoleGuard allowedRoles={["ADMIN"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
