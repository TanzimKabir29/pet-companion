import { Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { useAuth } from "../stores/auth";

const Navbar: Component = () => {
  const { state, actions } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.clearAuth();
    navigate("/login");
  };

  return (
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🐾</span>
        <span class="font-bold text-gray-900 text-lg">PetCompanion</span>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900">{state.user?.full_name}</p>
          <p class="text-xs text-gray-500 capitalize">{state.user?.user_type}</p>
        </div>
        <div class="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
          {state.user?.full_name?.[0]?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
};

export default Navbar;
