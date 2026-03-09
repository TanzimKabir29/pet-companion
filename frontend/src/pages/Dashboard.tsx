import { Component, createResource, For, Show, Switch, Match } from "solid-js";
import { A } from "@solidjs/router";
import { useAuth } from "../stores/auth";
import { petsApi } from "../api/pets";
import { shopsApi } from "../api/shops";

const Dashboard: Component = () => {
  const { state } = useAuth();

  return (
    <div>
      <Switch>
        <Match when={state.user?.user_type === "owner"}>
          <OwnerDashboard name={state.user?.full_name ?? ""} />
        </Match>
        <Match when={state.user?.user_type === "vet"}>
          <VetDashboard name={state.user?.full_name ?? ""} />
        </Match>
        <Match when={state.user?.user_type === "shop"}>
          <ShopDashboard name={state.user?.full_name ?? ""} />
        </Match>
      </Switch>
    </div>
  );
};

const OwnerDashboard: Component<{ name: string }> = (props) => {
  const [pets] = createResource(() => petsApi.list());

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome back, {props.name.split(" ")[0]}! 👋
        </h1>
        <p class="text-gray-500 mt-1">Here's a summary of your pets.</p>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          emoji="🐾"
          label="Total Pets"
          value={pets()?.length ?? 0}
          color="blue"
        />
        <StatCard
          emoji="📋"
          label="Health Records"
          value="—"
          color="green"
        />
        <StatCard
          emoji="📝"
          label="Wellbeing Notes"
          value="—"
          color="purple"
        />
      </div>

      {/* Pets preview */}
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">My Pets</h2>
          <A href="/pets" class="text-sm text-primary-600 hover:underline">
            View all →
          </A>
        </div>

        <Show when={!pets.loading} fallback={<LoadingState />}>
          <Show
            when={(pets()?.length ?? 0) > 0}
            fallback={
              <EmptyState
                emoji="🐾"
                title="No pets yet"
                desc="Add your first pet to get started"
                action={{ href: "/pets", label: "Add a pet" }}
              />
            }
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <For each={pets()?.slice(0, 4)}>
                {(pet) => (
                  <A
                    href={`/pets/${pet.id}`}
                    class="card flex items-center gap-3 hover:shadow-md transition-shadow"
                  >
                    <div class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} class="w-12 h-12 rounded-full object-cover" alt={pet.name} />
                      ) : "🐾"}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{pet.name}</p>
                      <p class="text-sm text-gray-400 capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ""}</p>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>

      {/* Quick links */}
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickLink href="/pets" emoji="➕" label="Add Pet" />
          <QuickLink href="/shops" emoji="🏪" label="Find a Shop" />
        </div>
      </div>
    </div>
  );
};

const VetDashboard: Component<{ name: string }> = (props) => {
  const [patients] = createResource(() => shopsApi.vetPatients());

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Welcome, Dr. {props.name.split(" ").slice(-1)[0]}! 🩺
        </h1>
        <p class="text-gray-500 mt-1">Manage your patients and their medical records.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard emoji="🐾" label="Active Patients" value={patients()?.length ?? 0} color="blue" />
        <StatCard emoji="📋" label="Records Created" value="—" color="green" />
      </div>

      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-gray-900">Recent Patients</h2>
          <A href="/vet" class="text-sm text-primary-600 hover:underline">View all →</A>
        </div>
        <Show when={!patients.loading} fallback={<LoadingState />}>
          <Show
            when={(patients()?.length ?? 0) > 0}
            fallback={
              <EmptyState
                emoji="🩺"
                title="No patients yet"
                desc="Patients will appear here once you add medical records"
              />
            }
          >
            <div class="grid gap-3">
              <For each={patients()?.slice(0, 5)}>
                {(p: any) => (
                  <A href={`/vet/patients/${p.id}`} class="card flex items-center gap-3 hover:shadow-md transition-shadow">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">🐾</div>
                    <div>
                      <p class="font-medium text-gray-900">{p.name}</p>
                      <p class="text-sm text-gray-400">{p.species}{p.breed ? ` · ${p.breed}` : ""} · Owner: {p.owner_name}</p>
                    </div>
                  </A>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </div>
    </div>
  );
};

const ShopDashboard: Component<{ name: string }> = (props) => {
  const [shop] = createResource(() => shopsApi.myShop());

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Shop Dashboard 🏪</h1>
        <p class="text-gray-500 mt-1">Manage your pet shop listing.</p>
      </div>

      <Show when={!shop.loading} fallback={<LoadingState />}>
        <Show
          when={shop()}
          fallback={
            <EmptyState
              emoji="🏪"
              title="No shop set up yet"
              desc="Create your shop listing to appear in the directory"
              action={{ href: "/my-shop", label: "Set up my shop" }}
            />
          }
        >
          {(s) => (
            <div class="card">
              <h2 class="font-semibold text-xl text-gray-900">{s().name}</h2>
              <p class="text-gray-500 mt-1">{s().description}</p>
              {s().city && <p class="text-sm text-gray-400 mt-1">📍 {s().city}</p>}
              <div class="mt-4">
                <A href="/my-shop" class="btn-primary">Manage Shop</A>
              </div>
            </div>
          )}
        </Show>
      </Show>
    </div>
  );
};

const StatCard: Component<{ emoji: string; label: string; value: number | string; color: string }> = (props) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div class="card flex items-center gap-4">
      <div class={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorMap[props.color]}`}>
        {props.emoji}
      </div>
      <div>
        <p class="text-2xl font-bold text-gray-900">{props.value}</p>
        <p class="text-sm text-gray-500">{props.label}</p>
      </div>
    </div>
  );
};

const QuickLink: Component<{ href: string; emoji: string; label: string }> = (props) => (
  <A
    href={props.href}
    class="card flex items-center gap-3 hover:shadow-md transition-shadow text-gray-700 hover:text-primary-600"
  >
    <span class="text-2xl">{props.emoji}</span>
    <span class="font-medium text-sm">{props.label}</span>
  </A>
);

const LoadingState: Component = () => (
  <div class="flex justify-center py-8">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const EmptyState: Component<{
  emoji: string;
  title: string;
  desc: string;
  action?: { href: string; label: string };
}> = (props) => (
  <div class="card text-center py-10">
    <div class="text-5xl mb-3">{props.emoji}</div>
    <h3 class="font-semibold text-gray-900">{props.title}</h3>
    <p class="text-gray-400 text-sm mt-1">{props.desc}</p>
    {props.action && (
      <A href={props.action.href} class="btn-primary mt-4 inline-flex">
        {props.action.label}
      </A>
    )}
  </div>
);

export default Dashboard;
