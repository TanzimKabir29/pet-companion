import { Component, createSignal } from "solid-js";
import { useNavigate, A } from "@solidjs/router";
import { authApi } from "../api/auth";
import { useAuth } from "../stores/auth";

const Login: Component = () => {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const { actions } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email(), password());
      actions.setAuth(res.token, res.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 p-4">
      <div class="w-full max-w-sm">
        {/* Logo */}
        <div class="text-center mb-8">
          <div class="text-6xl mb-3">🐾</div>
          <h1 class="text-3xl font-bold text-gray-900">PetCompanion</h1>
          <p class="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <div class="card">
          <form onSubmit={handleSubmit} class="space-y-4">
            {error() && (
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error()}
              </div>
            )}

            <div>
              <label class="label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="input"
                placeholder="you@example.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                required
                autocomplete="email"
              />
            </div>

            <div>
              <label class="label" for="password">Password</label>
              <input
                id="password"
                type="password"
                class="input"
                placeholder="••••••••"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                required
                autocomplete="current-password"
              />
            </div>

            <button
              type="submit"
              class="btn-primary w-full py-2.5"
              disabled={loading()}
            >
              {loading() ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-4">
            Don't have an account?{" "}
            <A href="/register" class="text-primary-600 font-medium hover:underline">
              Create one
            </A>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
