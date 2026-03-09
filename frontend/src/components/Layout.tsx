import { Component, ParentComponent, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../stores/auth";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout: ParentComponent = (props) => {
  const { state } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  if (!state.user) {
    navigate("/login", { replace: true });
    return null;
  }

  return (
    <div class="flex h-screen bg-gray-50">
      <Sidebar />
      <div class="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main class="flex-1 overflow-y-auto p-6">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
