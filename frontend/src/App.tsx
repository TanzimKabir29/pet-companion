import { Component, lazy, Show } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { AuthContext, createAuth } from "./stores/auth";
import Layout from "./components/Layout";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pets = lazy(() => import("./pages/Pets"));
const PetDetail = lazy(() => import("./pages/PetDetail"));
const Shops = lazy(() => import("./pages/Shops"));
const ShopDetail = lazy(() => import("./pages/ShopDetail"));
const ShopManager = lazy(() => import("./pages/ShopManager"));
const VetPortal = lazy(() => import("./pages/VetPortal"));
const VetPatient = lazy(() => import("./pages/VetPatient"));

const App: Component = () => {
  const auth = createAuth();

  return (
    <AuthContext.Provider value={auth}>
      <Router>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route
          path="/"
          component={() => (
            <Show
              when={auth.state.user}
              fallback={<Login />}
            >
              <Layout>
                <Dashboard />
              </Layout>
            </Show>
          )}
        />
        <Route
          path="/pets"
          component={() => (
            <Layout>
              <Pets />
            </Layout>
          )}
        />
        <Route
          path="/pets/:petId"
          component={() => (
            <Layout>
              <PetDetail />
            </Layout>
          )}
        />
        <Route
          path="/shops"
          component={() => (
            <Layout>
              <Shops />
            </Layout>
          )}
        />
        <Route
          path="/shops/:shopId"
          component={() => (
            <Layout>
              <ShopDetail />
            </Layout>
          )}
        />
        <Route
          path="/my-shop"
          component={() => (
            <Layout>
              <ShopManager />
            </Layout>
          )}
        />
        <Route
          path="/vet"
          component={() => (
            <Layout>
              <VetPortal />
            </Layout>
          )}
        />
        <Route
          path="/vet/patients/:petId"
          component={() => (
            <Layout>
              <VetPatient />
            </Layout>
          )}
        />
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
