import Employee from "layouts/employee/employee";
import EmployeeDetails from "layouts/employee/employeeDetails";
import Client from "layouts/client/clients";
import ClientDetails from "layouts/client/clientDetails"
import Inbox from "layouts/inbox";
import SignIn from "layouts/authentication/sign-in";
import Shop from "examples/Icons/Shop";
import CreditCard from "examples/Icons/CreditCard";

const routes = [
  {
    type: "collapse",
    name: "Client",
    key: "client",
    route: "/client",
    icon: <Shop size="12px" />,
    component: <Client />,
    noCollapse: true,
  },
  {
    name: "Client Details",
    key: "clientDetails",
    route: "/client-details/:id",
    component: <ClientDetails />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Employee",
    key: "employee",
    route: "/employee",
    icon: <Shop size="12px" />,
    component: <Employee />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Inbox",
    key: "inbox",
    route: "/inbox",
    icon: <CreditCard size="12px" />,
    component: <Inbox />,
    noCollapse: true,
  },
  {
    name: "Employee Details",
    key: "virtual-reality",
    route: "/employee-details/:id",
    component: <EmployeeDetails />,
    noCollapse: true,
  },
  {
    name: "Sign In",
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
    noCollapse: true,
  },
];

export default routes;
