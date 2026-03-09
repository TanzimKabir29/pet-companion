import { Component, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../stores/auth";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const ownerNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/pets", label: "My Pets", icon: "🐶" },
  { href: "/shops", label: "Pet Shops", icon: "🏪" },
];

const vetNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/vet", label: "My Patients", icon: "🩺" },
];

const shopNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/my-shop", label: "My Shop", icon: "🏪" },
];

const Sidebar: Component = () => {
  const { state } = useAuth();

  const navItems = () => {
    switch (state.user?.user_type) {
      case "vet": return vetNav;
      case "shop": return shopNav;
      default: return ownerNav;
    }
  };

  return (
    <aside class="w-56 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <nav class="flex-1 py-6 px-3">
        <ul class="space-y-1">
          <For each={navItems()}>
            {(item) => (
              <li>
                <A
                  href={item.href}
                  class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  activeClass="bg-primary-50 text-primary-700 font-medium"
                  end={item.href === "/"}
                >
                  <span class="text-lg">{item.icon}</span>
                  {item.label}
                </A>
              </li>
            )}
          </For>
        </ul>
      </nav>
      <div class="p-4 border-t border-gray-200">
        <p class="text-xs text-gray-400">PetCompanion v0.1</p>
      </div>
    </aside>
  );
};

export default Sidebar;
