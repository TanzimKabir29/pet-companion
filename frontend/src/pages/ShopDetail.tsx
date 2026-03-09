import { Component, createResource, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { shopsApi } from "../api/shops";

const ShopDetail: Component = () => {
  const params = useParams<{ shopId: string }>();
  const [shop] = createResource(() => shopsApi.get(params.shopId));

  return (
    <Show
      when={!shop.loading}
      fallback={
        <div class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <Show when={shop()} fallback={<p class="text-gray-500">Shop not found.</p>}>
        {(s) => (
          <div class="space-y-6">
            {/* Header */}
            <div class="card flex items-start gap-5">
              <div class="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center text-5xl flex-shrink-0">
                🏪
              </div>
              <div class="flex-1">
                <h1 class="text-2xl font-bold text-gray-900">{s().name}</h1>
                {s().city && <p class="text-gray-500 mt-0.5">📍 {s().city}{s().address ? `, ${s().address}` : ""}</p>}
                {s().description && <p class="text-gray-600 mt-3">{s().description}</p>}

                <div class="flex gap-4 mt-4 flex-wrap text-sm">
                  {s().phone && (
                    <a href={`tel:${s().phone}`} class="text-primary-600 hover:underline">
                      📞 {s().phone}
                    </a>
                  )}
                  {s().website && (
                    <a
                      href={s().website}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary-600 hover:underline"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Services */}
            <Show when={s().services.length > 0}>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 mb-3">Services & Products</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <For each={s().services}>
                    {(service) => (
                      <div class="card">
                        <div class="flex items-start justify-between">
                          <div>
                            <h3 class="font-medium text-gray-900">{service.name}</h3>
                            {service.category && (
                              <span class="badge badge-blue text-xs mt-1">{service.category}</span>
                            )}
                            {service.description && (
                              <p class="text-sm text-gray-500 mt-1">{service.description}</p>
                            )}
                          </div>
                          {service.price && (
                            <span class="font-semibold text-gray-900 ml-4 flex-shrink-0">
                              ${Number(service.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Hours */}
            <Show when={s().hours}>
              <div class="card">
                <h2 class="font-semibold text-gray-900 mb-3">Opening Hours</h2>
                <dl class="space-y-1 text-sm">
                  {Object.entries(s().hours ?? {}).map(([day, hours]) => (
                    <div class="flex justify-between">
                      <dt class="text-gray-500 capitalize">{day}</dt>
                      <dd class="text-gray-900">{String(hours)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Show>
          </div>
        )}
      </Show>
    </Show>
  );
};

export default ShopDetail;
