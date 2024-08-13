import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import SoftBox from 'components/SoftBox';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import SoftButton from 'components/SoftButton';
import Table from 'examples/Tables/Table';
import { useNavigate } from 'react-router-dom';
import { Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Swal from 'sweetalert2';
import { useGlobalContext } from '../../context/GlobalContext';
import { Formik, Field, Form as FormikForm, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Select from 'react-select';
import "../../assets/modalStyles/modal.css"

const Client = () => {
     const { users, employees, loading, fetchClientData } = useGlobalContext();
     const [selectedEmployees, setSelectedEmployees] = useState([]);
     const [editId, setEditId] = useState(null);
     const [open, setOpen] = useState(false);
     const [searchQuery, setSearchQuery] = useState('');
     const [initialValues, setInitialValues] = useState({
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

     const phoneValidationRegex = /^\+\d{1,3}\d{7,14}$/;

     const validationSchema = Yup.object({
          name: Yup.string().required('Name is required'),
          email: Yup.string().email('Invalid email format').required('Email is required'),
          phone: Yup.string()
               .matches(phoneValidationRegex, 'Phone number must include a country code and be valid.')
               .required('Phone is required'),
          address: Yup.string().required('Address is required'),
          siteName: Yup.string().required('Site Name is required'),
          siteLocation: Yup.string().required('Site Location is required'),
          siteAddress: Yup.string().required('Site Address is required'),
          poc: Yup.string().required('Point of Contact is required'),
     });

     const handleEmployeeChange = (selectedOptions) => {
          setSelectedEmployees(selectedOptions.map(option => option.value));
     };

     const handleSubmit = async (values, { resetForm }) => {
          try {
               if (editId) {
                    const userRef = doc(db, 'users', editId);
                    await updateDoc(userRef, {
                         name: values.name,
                         active: true,
                         address: values.address,
                         email: values.email,
                         phone: values.phone,
                    });

                    const clientQuery = query(collection(db, 'clients'), where('userId', '==', editId));
                    const clientSnapshot = await getDocs(clientQuery);
                    const clientId = clientSnapshot.docs[0]?.id;
                    if (clientId) {
                         const clientRef = doc(db, 'clients', clientId);
                         await updateDoc(clientRef, {
                              poc: values.poc,
                              siteaddress: values.siteAddress,
                              sitename: values.siteName,
                              sitelocation: values.siteLocation,
                              users: selectedEmployees,
                         });
                    }
                    Swal.fire({
                         position: "middle",
                         icon: "success",
                         title: "Data successfully updated!",
                         showConfirmButton: false,
                         timer: 1500,
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               } else {
                    const userRef = await addDoc(collection(db, 'users'), {
                         name: values.name,
                         active: true,
                         address: values.address,
                         email: values.email,
                         fcmtoken: [],
                         group: [],
                         phone: values.phone,
                         role: ['client'],
                    });

                    await addDoc(collection(db, 'clients'), {
                         createdat: new Date(),
                         poc: values.poc,
                         siteaddress: values.siteAddress,
                         sitename: values.siteName,
                         sitelocation: values.siteLocation,
                         userId: userRef.id,
                         users: selectedEmployees,
                    });

                    Swal.fire({
                         position: "middle",
                         icon: "success",
                         title: "Data successfully added!",
                         showConfirmButton: false,
                         timer: 1500,
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               }

               resetForm();
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
                    timer: 1500,
                    customClass: {
                         container: 'swal2-container-custom'
                    }
               });
          }
     };

     const handleEdit = async (id) => {
          const userToEdit = users.find(user => user.id === id);
          if (userToEdit) {
               const clientQuery = query(collection(db, 'clients'), where('userId', '==', id));
               const clientSnapshot = await getDocs(clientQuery);
               const clientData = clientSnapshot.docs[0]?.data();

               setInitialValues({
                    name: userToEdit.name,
                    email: userToEdit.email,
                    phone: userToEdit.phone,
                    address: userToEdit.address,
                    siteName: clientData?.sitename || '',
                    siteLocation: clientData?.sitelocation || '',
                    siteAddress: clientData?.siteaddress || '',
                    poc: clientData?.poc || '',
               });

               setSelectedEmployees(clientData?.users || []);
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
               confirmButtonText: 'Yes, delete it!',
               customClass: {
                    container: 'swal2-container-custom'
               }
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
                    Swal.fire({
                         title: 'Deleted!',
                         text: 'The Client has been deleted.',
                         icon: 'success',
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               } catch (error) {
                    console.error('Error deleting document: ', error);
                    Swal.fire({
                         title: 'Error!',
                         text: 'There was an error deleting the Client.',
                         icon: 'error',
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               }
          }
     };

     const handleViewDetail = (id) => {
          navigate(`/client-details/${id}`);
     };

     const handleCancel = (resetForm) => {
          resetForm();
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

     const employeeOptions = employees?.map(employee => ({
          value: employee.id,
          label: employee.name,
     }));


     const customStyles = {
          control: (provided) => ({
               ...provided,
               minHeight: '40px',
               fontSize: '15px',
          }),
          valueContainer: (provided) => ({
               ...provided,
               padding: '4px 8px',
          }),
          input: (provided) => ({
               ...provided,
               margin: '0',
               padding: '0',
          }),
          indicatorsContainer: (provided) => ({
               ...provided,
               height: '32px',
          }),
          option: (provided) => ({
               ...provided,
               fontSize: '14px',
               padding: '8px 12px',
          }),
     };

     return (
          <DashboardLayout>
               <DashboardNavbar />
               <SoftBox py={3}>
                    <SoftBox display="flex" justifyContent="end" alignItems="center" px={3}>
                         <SoftButton
                              variant="gradient"
                              color="info"
                              size="medium"
                              onClick={() => {
                                   setInitialValues({
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
                                   setOpen(true);
                              }}
                         >
                              Add New Client
                         </SoftButton>
                    </SoftBox>

                    {loading ? (
                         <SoftBox display="flex" justifyContent="center" alignItems="center" height="60vh">
                              <CircularProgress />
                         </SoftBox>
                    ) : (
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
                              <Table
                                   columns={tableColumns}
                                   rows={tableRows}
                              />
                         </Card>
                    )}

               </SoftBox>
               <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                         {editId ? 'Edit Client' : 'Add Client'}
                    </DialogTitle>
                    <DialogContent>
                         <Formik
                              initialValues={initialValues}
                              validationSchema={validationSchema}
                              onSubmit={handleSubmit}
                              enableReinitialize
                         >
                              {({ resetForm, handleSubmit, errors, touched }) => (
                                   <FormikForm onSubmit={handleSubmit}>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Name
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="name"
                                                  placeholder="Name"
                                             />
                                             <ErrorMessage name="name" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       E-mail
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="email"
                                                  placeholder="Email"
                                             />
                                             <ErrorMessage name="email" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Phone
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="phone"
                                                  placeholder="Phone"
                                             />
                                             <ErrorMessage name="phone" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Address
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="address"
                                                  placeholder="Address"
                                             />
                                             <ErrorMessage name="address" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Site Name
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field

                                                  as={SoftInput}
                                                  name="siteName"
                                                  placeholder="Site Name"
                                             />
                                             <ErrorMessage name="siteName" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Site Location
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="siteLocation"
                                                  placeholder="Site Location"
                                             />
                                             <ErrorMessage name="siteLocation" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Site Address
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="siteAddress"
                                                  placeholder="Site Address"
                                             />
                                             <ErrorMessage name="siteAddress" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       POC
                                                  </SoftTypography>
                                             </SoftBox>
                                             <SoftBox>
                                                  <Field
                                                       as={SoftInput}
                                                       name="poc"
                                                       placeholder="Point of Contact"
                                                  />
                                                  <ErrorMessage name="poc" component="div" style={{ color: 'red', fontSize: 12 }} />
                                             </SoftBox>
                                        </SoftBox>
                                        <SoftBox mb={4}>
                                             <SoftBox ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Select Employee
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Select
                                                  mb={3}
                                                  styles={customStyles}
                                                  options={employeeOptions}
                                                  isMulti
                                                  value={employeeOptions.filter(option => selectedEmployees.includes(option.value))}
                                                  onChange={handleEmployeeChange}
                                                  placeholder="Select Employees"
                                             />
                                        </SoftBox>
                                        <DialogActions>
                                             <SoftButton
                                                  variant="outlined"
                                                  color="secondary"
                                                  onClick={() => handleCancel(resetForm)}
                                             >
                                                  Cancel
                                             </SoftButton>
                                             <SoftButton
                                                  variant="gradient"
                                                  color="primary"
                                                  type="submit"
                                                  onSubmit={handleSubmit}
                                             >
                                                  {editId ? 'Update' : 'Add'}
                                             </SoftButton>
                                        </DialogActions>
                                   </FormikForm>
                              )}
                         </Formik>

                    </DialogContent>
               </Dialog>
          </DashboardLayout>
     );
};

export default Client;
