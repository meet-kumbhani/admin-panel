import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Settings";
import theme from "assets/theme";
import routes from "routes";
import brand from "./assets/images/bruce-mars.jpg";
import { useSoftUIController, setMiniSidenav } from "context";
import 'bootstrap/dist/css/bootstrap.css';
import { auth } from "./firebase/config";
import SignIn from "layouts/authentication/sign-in";
import Client from "layouts/client/clients";
import { CircularProgress } from "@mui/material";

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [authuser, setAuthuser] = useState(null);
  const [loading, setLoading] = useState(true);
  console.log(authuser, "<-- auth user");

  const { pathname } = useLocation();

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthuser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brand={brand}
            brandName="Vaid Architects"
            routes={routes}
            onMouseEnter={handleOnMouseEnter}
            onMouseLeave={handleOnMouseLeave}
          />
          <Configurator />
          {/* {configsButton} */}
        </>
      )}
      {layout === "vr" && <Configurator />}
      <Routes>
        {authuser == null ? (
          <>
            <Route path="*" element={<SignIn />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/client" />} />
            {getRoutes(routes)}
            <Route path="/client" element={<Client />} />
          </>
        )}
      </Routes>
    </ThemeProvider>
  );
}
