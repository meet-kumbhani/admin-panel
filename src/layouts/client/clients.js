import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import SoftBox from 'components/SoftBox';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import SoftButton from 'components/SoftButton';
import Table from 'examples/Tables/Table';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import { Card } from '@mui/material';

const Client = () => {
     const [user, setUser] = useState(null);
     const [users, setUsers] = useState([]);
     const [employees, setEmployees] = useState([]);
     const [selectedEmployees, setSelectedEmployees] = useState([]);
     const [editId, setEditId] = useState(null);
     const [formValues, setFormValues] = useState({
          name: '',
          email: '',
          phone: '',
          address: '',
          siteName: '',
          siteLocation: '',
          siteAddress: '',
          poc: '',
     });

     const clientData = users.filter(user => user?.role?.includes('client'));
     const navigate = useNavigate()

     useEffect(() => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
               setUser(user);
          });
          return unsubscribe;
     }, []);



     useEffect(() => {
          const fetchEmployees = async () => {
               try {
                    const usersCollection = collection(db, "users");
                    const q = query(usersCollection, where("role", "array-contains", "employee"));
                    const querySnapshot = await getDocs(q);
                    const employeeList = querySnapshot.docs.map(doc => ({
                         id: doc.id,
                         ...doc.data()
                    }));
                    setEmployees(employeeList);
               } catch (error) {
                    console.error("Error fetching employees: ", error);
               }
          };

          fetchEmployees();
     }, []);


     useEffect(() => {
          if (user) {
               const getUserData = async () => {
                    try {
                         const usersCollection = collection(db, "users");
                         const q = query(usersCollection);
                         const querySnapshot = await getDocs(q);
                         const allUsers = [];

                         for (const doc of querySnapshot.docs) {
                              const userdata = doc.data();
                              const userId = doc.id;
                              const clientsCollection = collection(db, "clients");
                              const clientQuery = query(clientsCollection, where("userId", "==", userId));
                              const clientSnapshot = await getDocs(clientQuery);

                              const clients = clientSnapshot.docs.map((clientDoc) => ({
                                   ...clientDoc.data(),
                                   id: clientDoc.id,
                                   createdat: clientDoc.data().createdat.toDate(),
                              }));

                              allUsers.push({ ...userdata, id: userId, clients });
                         }

                         setUsers(allUsers);
                    } catch (error) {
                         console.error("Error", error);
                    }
               };

               getUserData();
          }
     }, [user]);

     const handleEmployeeChange = (e) => {
          const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
          setSelectedEmployees(selectedOptions);
     };


     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormValues({ ...formValues, [name]: value });
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          try {
               if (Object.values(formValues).some(value => value.trim() === '')) {
                    alert('Please fill in all fields.');
                    return;
               }

               if (editId) {
                    // Update user and client data
                    const userRef = doc(db, 'users', editId);
                    await updateDoc(userRef, {
                         name: formValues.name,
                         active: true,
                         address: formValues.address,
                         email: formValues.email,
                         phone: formValues.phone,
                    });

                    const clientQuery = query(collection(db, 'clients'), where('userId', '==', editId));
                    const clientSnapshot = await getDocs(clientQuery);
                    const clientId = clientSnapshot.docs[0]?.id;
                    if (clientId) {
                         const clientRef = doc(db, 'clients', clientId);
                         await updateDoc(clientRef, {
                              poc: formValues.poc,
                              siteaddress: formValues.siteAddress,
                              sitename: formValues.siteName,
                              sitelocation: formValues.siteLocation,
                              users: selectedEmployees,
                         });
                    }

                    alert('Data successfully updated!');
               } else {
                    // Add new user and client data
                    const userRef = await addDoc(collection(db, 'users'), {
                         name: formValues.name,
                         active: true,
                         address: formValues.address,
                         email: formValues.email,
                         fcmtoken: [],
                         group: [],
                         phone: formValues.phone,
                         role: ['client'],
                    });

                    await addDoc(collection(db, 'clients'), {
                         createdat: new Date(),
                         poc: formValues.poc,
                         siteaddress: formValues.siteAddress,
                         sitename: formValues.siteName,
                         sitelocation: formValues.siteLocation,
                         userId: userRef.id,
                         users: selectedEmployees,
                    });

                    alert('Data successfully added!');
               }

               setFormValues({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    siteName: '',
                    siteLocation: '',
                    siteAddress: '',
                    poc: '',
               });
               setSelectedEmployees([]);
               setEditId(null);
               fetchData();
          } catch (error) {
               console.error('Error adding document: ', error);
               alert('Error adding data!');
          }
     };


     const handleEdit = (id) => {
          const userToEdit = users.find(user => user.id === id);
          if (userToEdit) {
               setFormValues({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    phone: userToEdit.phone,
                    address: userToEdit.address,
                    siteName: userToEdit.clients[0]?.sitename || '',
                    siteLocation: userToEdit.clients[0]?.sitelocation || '',
                    siteAddress: userToEdit.clients[0]?.siteaddress || '',
                    poc: userToEdit.clients[0]?.poc || '',
               });
               setEditId(id);
          }
     };

     const handleDelete = async (id) => {
          try {
               await deleteDoc(doc(db, 'users', id));
               const clientQuery = query(collection(db, 'clients'), where('userId', '==', id));
               const clientSnapshot = await getDocs(clientQuery);
               clientSnapshot.forEach(async (clientDoc) => {
                    await deleteDoc(doc(db, 'clients', clientDoc.id));
               });
               alert('Data successfully deleted!');
               fetchData();
          } catch (error) {
               console.error('Error deleting document: ', error);
               alert('Error deleting data!');
          }
     };

     const fetchData = async () => {
          if (user) {
               const getUserData = async () => {
                    try {
                         const usersCollection = collection(db, "users");
                         const q = query(usersCollection);
                         const querySnapshot = await getDocs(q);
                         const allUsers = [];

                         for (const doc of querySnapshot.docs) {
                              const userdata = doc.data();
                              const userId = doc.id;
                              const clientsCollection = collection(db, "clients");
                              const clientQuery = query(clientsCollection, where("userId", "==", userId));
                              const clientSnapshot = await getDocs(clientQuery);

                              const clients = clientSnapshot.docs.map((clientDoc) => ({
                                   ...clientDoc.data(),
                                   id: clientDoc.id,
                                   createdat: clientDoc.data().createdat.toDate(),
                              }));

                              allUsers.push({ ...userdata, id: userId, clients });
                         }

                         setUsers(allUsers);
                    } catch (error) {
                         console.error("Error", error);
                    }
               };

               getUserData();
          }
     };

     useEffect(() => {
          fetchData();
     }, [user]);

     const handleViewDetail = (id) => {
          navigate(`/client-details/${id}`);
     };

     const tableRows = clientData.map(user => ({
          name: user.name,
          email: user.email,
          phone: user.phone,
          sitename: user.clients.map(client => client.sitename).join(', '),
          date: user.clients.map(client => client.createdat.toLocaleString()).join(', '),
          actions: (
               <>
                    <SoftButton variant="gradient" color="info" onClick={() => handleEdit(user.id)} size="small">Edit</SoftButton>
                    <SoftButton variant="gradient" color="error" onClick={() => handleDelete(user.id)} size="small" style={{ marginLeft: 10 }}>Delete</SoftButton>
                    <SoftButton variant="gradient" color="primary" size="small" style={{ marginLeft: 10 }} onClick={() => handleViewDetail(user.id)}>View</SoftButton>
               </>
          ),
          hasBorder: true
     }));

     const tableColumns = [
          { name: "name", align: "left" },
          { name: "email", align: "left" },
          { name: "phone", align: "left" },
          { name: "sitename", align: "left" },
          { name: "date", align: "center" },
          { name: "actions", align: "center" },
     ];
     return (
          <DashboardLayout>
               <DashboardNavbar />
               <form onSubmit={handleSubmit}>
                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Name
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="name"
                              value={formValues.name}
                              onChange={handleChange}
                              placeholder="Enter name"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   E-mail
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="email"
                              type="email"
                              value={formValues.email}
                              onChange={handleChange}
                              placeholder="Enter email"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Phone
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="phone"
                              value={formValues.phone}
                              onChange={handleChange}
                              placeholder="Enter phone number"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Address
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="address"
                              value={formValues.address}
                              onChange={handleChange}
                              placeholder="Enter address"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Site Name
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="siteName"
                              value={formValues.siteName}
                              onChange={handleChange}
                              placeholder="Enter site name"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Site Location
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="siteLocation"
                              value={formValues.siteLocation}
                              onChange={handleChange}
                              placeholder="Enter site location"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Site Address
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="siteAddress"
                              value={formValues.siteAddress}
                              onChange={handleChange}
                              placeholder="Enter site address"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   POC
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="poc"
                              value={formValues.poc}
                              onChange={handleChange}
                              placeholder="Enter POC"
                         />
                    </SoftBox>

                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Select Employee
                              </SoftTypography>
                         </SoftBox>
                         <Form.Select
                              aria-label="Select employee"
                              multiple
                              value={selectedEmployees}
                              onChange={handleEmployeeChange}
                         >
                              {employees?.map(employee => (
                                   <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                   </option>
                              ))}
                         </Form.Select>
                    </SoftBox>



                    <SoftButton variant="gradient" color="info" type="submit">
                         {editId ? 'Update' : 'Submit'}
                    </SoftButton>
               </form>

               {clientData.length > 0 ? (
                    <Card sx={{ marginTop: 5 }}>
                         <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                              <SoftTypography variant="h5">Client List</SoftTypography>
                         </SoftBox>
                         <SoftBox
                              sx={{
                                   "& .MuiTableRow-root:not(:last-child)": {
                                        "& td": {
                                             borderBottom: ({ borders: { borderWidth, borderColor } }) =>
                                                  `${borderWidth[1]} solid ${borderColor}`,
                                        },
                                   },
                              }}
                         >
                              <Table columns={tableColumns} rows={tableRows} />

                         </SoftBox>
                    </Card>
               ) : (
                    <p>No clients found</p>
               )}
          </DashboardLayout>
     );
};

export default Client;
