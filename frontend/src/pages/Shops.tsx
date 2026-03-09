import { Component, createResource, createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { shopsApi } from "../api/shops";
import type { PetShop } from "../types";

const Shops: Component = () => {
  const [shops] = createResource(() => shopsApi.list());
  const [search, setSearch] = createSignal("");

  const filtered = () =>
    shops()?.filter(
      (s) =>
        s.name.toLowerCase().includes(search().toLowerCase()) ||
        s.city?.toLowerCase().includes(search().toLowerCase()) ||
        s.description?.toLowerCase().includes(search().toLowerCase())
    );

  return (
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Pet Shops</h1>
        <p class="text-gray-500 text-sm mt-0.5">Discover pet shops in your area</p>
      </div>

      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          class="input pl-9"
          type="text"
          placeholder="Search by name, city, or service..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <Show when={!shops.loading} fallback={<Loading />}>
        <Show
          when={(filtered()?.length ?? 0) > 0}
          fallback={
            <div class="card text-center py-16">
              <div class="text-6xl mb-4">🏪</div>
              <h3 class="font-semibold text-gray-900">No shops found</h3>
              <p class="text-gray-400 text-sm mt-1">
                {search() ? "Try a different search term" : "No pet shops are listed yet"}
              </p>
            </div>
          }
        >
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <For each={filtered()}>
              {(shop) => <ShopCard shop={shop} />}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
};

const ShopCard: Component<{ shop: PetShop }> = (props) => (
  <div class="card hover:shadow-md transition-shadow">
    <div class="flex items-start gap-3">
      {props.shop.logo_url ? (
        <img
          src={props.shop.logo_url}
          alt={props.shop.name}
          class="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0"
        />
      ) : (
        <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-3xl flex-shrink-0">
          🏪
        </div>
      )}
      <div class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900">{props.shop.name}</h3>
        {props.shop.city && (
          <p class="text-sm text-gray-400">📍 {props.shop.city}</p>
        )}
        {props.shop.description && (
          <p class="text-sm text-gray-600 mt-2 line-clamp-2">{props.shop.description}</p>
        )}
      </div>
    </div>

    <div class="mt-4 flex items-center gap-2 flex-wrap text-sm text-gray-500">
      {props.shop.phone && <span>📞 {props.shop.phone}</span>}
    </div>

    <div class="mt-4">
      <A href={`/shops/${props.shop.id}`} class="btn-primary text-sm w-full justify-center">
        View Shop
      </A>
    </div>
  </div>
);

const Loading: Component = () => (
  <div class="flex justify-center py-12">
    <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default Shops;
