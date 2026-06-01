import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/src/pages/Home";
import MatchDetails from "@/src/pages/MatchDetails";
import Login from "@/src/pages/Login";
import Signup from "@/src/pages/Signup";
import DashboardLayout from "@/src/layouts/DashboardLayout";
import DashboardHome from "@/src/pages/DashboardHome";
import MyMatches from "@/src/pages/MyMatches";
import CreateMatch from "@/src/pages/CreateMatch";
import PlayingXI from "@/src/pages/PlayingXI";
import LiveScoring from "@/src/pages/LiveScoring";
import Teams from "@/src/pages/Teams";
import Players from "@/src/pages/Players";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/matches/:matchId" element={<MatchDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Authorized Dashboard Console Pages */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="home" element={<DashboardHome />} />
        <Route path="matches" element={<MyMatches />} />
        <Route path="create-match" element={<CreateMatch />} />
        <Route path="matches/:matchId/lineup" element={<PlayingXI />} />
        <Route path="matches/:matchId/score" element={<LiveScoring />} />
        <Route path="teams" element={<Teams />} />
        <Route path="players" element={<Players />} />
      </Route>

      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
