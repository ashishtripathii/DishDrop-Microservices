import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoutes";
import SelectRole from "./pages/SelectRole";
import Navbar from "./components/Navbar";
import Account from "./pages/Account";
import { useAppData } from "./context/useAppData";
import Restaurant from "./pages/Restaurant";
import RestaurantUserPage from "./pages/RestaurantUserPage";
import Cart from "./pages/Cart";
import AddAddressPage from "./pages/AddAddressPage";
import CheckOut from "./pages/CheckOut";
import PaymentSuccess from "./pages/PaymentSuccess";
import OrderSuccess from "./pages/OrderSuccess";
import Orders from "./pages/Orders";
import OrderPage from "./pages/OrderPage";
import RiderDashBoard from "./pages/RiderDashBoard";
import Admin from "./pages/Admin";
const App = () => {
  const { user, loading } = useAppData();

  // if (user && user.role === "seller") {
  //   return <Restaurant />;
  // }

  // return (

  //   <>
  //     <Toaster />
  //     <BrowserRouter>
  //       <Navbar />
  //       <Routes>
  //         <Route element={<PublicRoute />}>
  //           <Route path="/login" element={<Login />} />
  //         </Route>
  //         <Route element={<ProtectedRoute />}>
  //           <Route path="/" element={<Home />} />
  //           <Route path="/select-role" element={<SelectRole />} />
  //           <Route path="/account" element={<Account />} />
  //         </Route>
  //       </Routes>
  //     </BrowserRouter>
  //   </>
  // );

  if (loading) {
    return (
      <h1 className="text-2xl font-bold text-red-500 text-center mt-56">
        Loading.....
      </h1>
    );
  }

  if (user?.role === "admin") {
    return <Admin />;
  }

  if (user?.role === "seller") {
    return <Restaurant />;
  }

  if (user?.role === "rider") {
    return <RiderDashBoard />;
  }

  return (
    <>
      <Toaster position="top-right" />

      {user && user.role === "admin" ? (
        <Admin />
      ) : user && user.role === "seller" ? (
        <Restaurant />
      ) : user && user.role === "rider" ? (
        <RiderDashBoard />
      ) : (
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:id" element={<OrderPage />} />

              <Route
                path="/paymentsuccess/:paymentId"
                element={<PaymentSuccess />}
              />

              <Route path="/ordersuccess" element={<OrderSuccess />} />
              <Route path="/checkout" element={<CheckOut />} />
              <Route path="/address" element={<AddAddressPage />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/select-role" element={<SelectRole />} />
              <Route path="/account" element={<Account />} />

              <Route path="/restaurant/:id" element={<RestaurantUserPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      )}
    </>
  );
};

export default App;
