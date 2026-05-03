import { createBrowserRouter, Outlet, RouterProvider, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { RecoilRoot } from "recoil";
import { Navbar, PrivateRoute } from "./components";


import {
  Home,
  Footer,
  Gig,
  Gigs,
  MyGigs,
  Add,
  Orders,
  Message,
  Messages,
  Login,
  Register,
  Pay,
  Success,
  NotFound,
  AdminLogin,
  AdminDashboard,
  Delivery,
  SellerOrderDetails,
  Wishlist,
  Help,
  Community,
  About,
  Contact,
} from "./pages";
import "./App.scss";

function RouteErrorFallback() {
  const error = useRouteError();
  const isRouteError = isRouteErrorResponse(error);

  const title = isRouteError ? `${error.status} ${error.statusText}` : "Something went wrong";
  const message = isRouteError
    ? (error.data?.message || "The page could not be loaded.")
    : (error?.message || "An unexpected error occurred while loading this page.");

  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style={{ maxWidth: "680px", textAlign: "center" }}>
        <h1>{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  );
}

const paths = [
  { path: "/", element: <Home /> },
  { path: "/gig/:_id", element: <Gig /> },
  { path: "/gigs", element: <Gigs /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/about", element: <About /> },
  { path: "/contact", element: <Contact /> },
  {
    path: "/orders",
    element: (
      <PrivateRoute>
        <Orders />
      </PrivateRoute>
    ),
  },
  {
    path: "/organize",
    element: (
      <PrivateRoute>
        <Add />
      </PrivateRoute>
    ),
  },
  {
    path: "/my-gigs",
    element: (
      <PrivateRoute>
        <MyGigs />
      </PrivateRoute>
    ),
  },
  {
    path: "/message/:conversationID",
    element: (
      <PrivateRoute>
        <Message />
      </PrivateRoute>
    ),
  },
  {
    path: "/messages",
    element: (
      <PrivateRoute>
        <Messages />
      </PrivateRoute>
    ),
  },
  {
    path: "/pay/:_id",
    element: (
      <PrivateRoute>
        <Pay />
      </PrivateRoute>
    ),
  },
  {
    path: "/success",
    element: (
      <PrivateRoute>
        <Success />
      </PrivateRoute>
    ),
  },
  {
    path: "/delivery/:orderId",
    element: (
      <PrivateRoute>
        <Delivery />
      </PrivateRoute>
    ),
  },
  {
    path: "/seller/orders/:orderId",
    element: (
      <PrivateRoute isSeller={true}>
        <SellerOrderDetails />
      </PrivateRoute>
    ),
  },
  {
    path: "/wishlist",
    element: (
      <PrivateRoute>
        <Wishlist />
      </PrivateRoute>
    ),
  },
  { path: "/help", element: <Help /> },
  { path: "/admin/login", element: <AdminLogin /> },
  {
    path: "/admin/dashboard",
    element: (
      <PrivateRoute adminOnly={true}>
        <AdminDashboard />
      </PrivateRoute>
    ),
  },
  {
    path: "/community",
    element: (
      <PrivateRoute isSeller={true}>
        <Community />
      </PrivateRoute>
    ),
  },
  { path: "*", element: <NotFound /> },
];

function App() {
  const queryClient = new QueryClient();
  const Layout = () => {
    return (
      <QueryClientProvider client={queryClient}>
        <Navbar />
        <Outlet />
        <Footer />
      </QueryClientProvider>
    );
  };
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <RouteErrorFallback />,
      children: paths.map(({ path, element }) => ({ path, element })),
    },
  ]);

  return (
    <div className="App">
      <RecoilRoot>
        <RouterProvider router={router} />
        <Toaster />
      </RecoilRoot>
    </div>
  );
}

export default App;