import React, { useState } from 'react';
import { collection, query, getDocs, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SoftBox from 'components/SoftBox';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import SoftButton from 'components/SoftButton';
import Table from 'examples/Tables/Table';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import { Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Icon } from '@mui/material';
import Swal from 'sweetalert2';
import { useGlobalContext } from '../../context/GlobalContext';

const Client = () => {
     const { users, employees, loading, fetchClientData } = useGlobalContext();
     const [selectedEmployees, setSelectedEmployees] = useState([]);
     const [editId, setEditId] = useState(null);
     const [open, setOpen] = useState(false);
     const [searchQuery, setSearchQuery] = useState('');
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

     const clientData = users.filter(user => user?.role?.includes('client')).sort((a, b) => a.name.localeCompare(b.name));

     const navigate = useNavigate();

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
                    Swal.fire({
                         position: "middle",
                         icon: "error",
                         title: "Please fill in all fields.",
                         showConfirmButton: false,
                         timer: 1500
                    });
                    return;
               }

               if (editId) {
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
                    Swal.fire({
                         position: "middle",
                         icon: "success",
                         title: "Data successfully updated!",
                         showConfirmButton: false,
                         timer: 1500
                    });
               } else {
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

                    Swal.fire({
                         position: "middle",
                         icon: "success",
                         title: "Data successfully added!",
                         showConfirmButton: false,
                         timer: 1500
                    });
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
               setOpen(false);
               fetchClientData();
          } catch (error) {
               console.error('Error adding document: ', error);
               Swal.fire({
                    position: "middle",
                    icon: "error",
                    title: "Error adding document!",
                    showConfirmButton: false,
                    timer: 1500
               });
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
               setOpen(true);
          }
     };

     const handleDeleteClient = async (id) => {
          const result = await Swal.fire({
               title: 'Are you sure?',
               text: "You won't be able to revert this!",
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#3085d6',
               cancelButtonColor: '#d33',
               confirmButtonText: 'Yes, delete it!'
          });
          if (result.isConfirmed) {
               try {
                    await deleteDoc(doc(db, 'users', id));
                    const clientQuery = query(collection(db, 'clients'), where('userId', '==', id));
                    const clientSnapshot = await getDocs(clientQuery);
                    clientSnapshot.forEach(async (clientDoc) => {
                         await deleteDoc(doc(db, 'clients', clientDoc.id));
                    });
                    fetchClientData();
                    Swal.fire(
                         'Deleted!',
                         'The client has been deleted.',
                         'success'
                    );
               } catch (error) {
                    console.error('Error deleting document: ', error);
                    Swal.fire(
                         'Error!',
                         'There was an error deleting the client.',
                         'error'
                    );
               }

          }

     };

     const handleViewDetail = (id) => {
          navigate(`/client-details/${id}`);
     };

     const handleCancel = () => {
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
          setOpen(false);
     };

     const handleSearchChange = (e) => {
          setSearchQuery(e.target.value.toLowerCase());
     };

     const filteredClient = clientData.filter(user =>
          user.name.toLowerCase().includes(searchQuery)
     );

     const tableRows = filteredClient.map(user => ({
          name: user.name,
          email: user.email,
          phone: user.phone,
          sitename: user.clients.map(client => client.sitename).join(', '),
          date: user.clients.map(client => client.createdat.toLocaleString()).join(', '),
          actions: (
               <>
                    <SoftButton variant="gradient" color="info" onClick={() => handleEdit(user.id)} size="small">Edit</SoftButton>
                    <SoftButton variant="gradient" color="error" onClick={() => handleDeleteClient(user.id)} size="small" style={{ marginLeft: 10 }}>Delete</SoftButton>
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


               <SoftBox py={3}>
                    <SoftBox display="flex" justifyContent="end" alignItems="center" px={3}>
                         <SoftButton
                              variant="gradient"
                              color="info"
                              size="medium"
                              onClick={() => setOpen(true)}
                         >
                              Add New Client
                         </SoftButton>
                    </SoftBox>
                    <SoftBox p={3}>

                         {loading ? (
                              <SoftBox display="flex" justifyContent="center" alignItems="center" height="60vh">
                                   <CircularProgress />
                              </SoftBox>
                         ) : (
                              <>
                                   {clientData.length > 0 ? (
                                        <Card sx={{ marginTop: 4 }}>
                                             <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                                                  <SoftTypography variant="h5">Client List</SoftTypography>
                                                  <SoftBox pr={1}>
                                                       <SoftInput
                                                            placeholder="Search..."
                                                            icon={{ component: "search", direction: "left" }}
                                                            value={searchQuery}
                                                            onChange={handleSearchChange}
                                                       />
                                                  </SoftBox>
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
                              </>
                         )}

                    </SoftBox>

               </SoftBox>


               <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
                    <DialogTitle>{editId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                    <DialogContent>
                         <Form onSubmit={handleSubmit}>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Name
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Name"
                                        name="name"
                                        value={formValues.name}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Email
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Email"
                                        name="email"
                                        value={formValues.email}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Phone
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Phone"
                                        name="phone"
                                        value={formValues.phone}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Address
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Address"
                                        name="address"
                                        value={formValues.address}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Site Name
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Site Name"
                                        name="siteName"
                                        value={formValues.siteName}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Site Location
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Site Location"
                                        name="siteLocation"
                                        value={formValues.siteLocation}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Site Address
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Site Address"
                                        name="siteAddress"
                                        value={formValues.siteAddress}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        POC
                                   </SoftTypography>
                                   <SoftInput
                                        placeholder="Point of Contact"
                                        name="poc"
                                        value={formValues.poc}
                                        onChange={handleChange}
                                        fullWidth
                                   />
                              </SoftBox>
                              <SoftBox mb={0.5}>
                                   <SoftTypography component="label" variant="caption" fontWeight="bold">
                                        Employees
                                   </SoftTypography>
                                   <Form.Group controlId="employeeSelect">
                                        <Form.Control
                                             as="select"
                                             multiple
                                             value={selectedEmployees}
                                             onChange={handleEmployeeChange}
                                        >
                                             {employees.map(employee => (
                                                  <option key={employee.id} value={employee.id}>
                                                       {employee.name}
                                                  </option>
                                             ))}
                                        </Form.Control>
                                   </Form.Group>
                              </SoftBox>
                         </Form>
                    </DialogContent>
                    <DialogActions>
                         <SoftButton
                              onClick={handleCancel}
                              variant="outlined"
                              color="secondary"
                         >
                              Cancel
                         </SoftButton>
                         <SoftButton
                              onClick={handleSubmit}
                              variant="contained"
                              color="primary"
                         >
                              {editId ? 'Update' : 'Add'}
                         </SoftButton>
                    </DialogActions>
               </Dialog>

          </DashboardLayout>
     );
};

export default Client;
