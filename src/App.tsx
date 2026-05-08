import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreProvider } from "@/lib/store";
import { CelebrationProvider } from "@/contexts/CelebrationContext";

import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import AdminProfile from "./pages/admin/AdminProfile";

import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffTaskLog from "./pages/staff/StaffTaskLog";
import StaffLeaderboard from "./pages/staff/StaffLeaderboard";
import StaffProfile from "./pages/staff/StaffProfile";

import MemberProfile from "./pages/MemberProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreProvider>
      <CelebrationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="tasks" element={<AdminTasks />} />
              <Route path="submissions" element={<AdminSubmissions />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="leaderboard" element={<AdminLeaderboard />} />
              <Route path="profile" element={<AdminProfile />} />
              <Route path="members/:memberId" element={<MemberProfile />} />
            </Route>

            <Route path="/staff" element={<StaffLayout />}>
              <Route index element={<StaffDashboard />} />
              <Route path="tasks" element={<StaffTaskLog />} />
              <Route path="leaderboard" element={<StaffLeaderboard />} />
              <Route path="profile" element={<StaffProfile />} />
              <Route path="members/:memberId" element={<MemberProfile />} />
            </Route>

            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CelebrationProvider>
    </StoreProvider>
  </QueryClientProvider>
);

export default App;
