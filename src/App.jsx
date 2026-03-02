import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import DogPage from "./pages/DogPage";
import AddDog from "./pages/AddDog";
import DebugPhotos from "./pages/DebugPhotos";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dog/:id" element={<DogPage />} />
      <Route path="/add-dog" element={<AddDog />} />
      <Route path="/debug-photos" element={<DebugPhotos />} />
    </Routes>
  );
}

export default App;
