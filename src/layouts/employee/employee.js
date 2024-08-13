import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, onSnapshot } from 'firebase/firestore';
import SoftBox from 'components/SoftBox';
import SoftButton from 'components/SoftButton';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import { db } from '../../firebase/config';
import Table from 'examples/Tables/Table';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { Card, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useGlobalContext } from '../../context/GlobalContext';
import { ErrorMessage, Formik, Field, Form as FormikForm } from 'formik';
import * as Yup from 'yup';
import "../../assets/modalStyles/modal.css"

const validationSchema = Yup.object().shape({
     name: Yup.string().required('Name is required'),
     email: Yup.string().email('Invalid email format').required('Email is required'),
     phone: Yup.string().matches(/^\+\d{1,3}\d{1,14}(?:x.+)?$/, 'Phone number must include a country code').required('Phone number is required'),
     address: Yup.string().required('Address is required'),
});

const Employee = () => {
     const { employees, loading, setEmployees } = useGlobalContext();
     const [editingId, setEditingId] = useState(null);
     const [open, setOpen] = useState(false);
     const [searchQuery, setSearchQuery] = useState('');
     const [initialValues, setInitialValues] = useState({
          name: '',
          email: '',
          phone: '',
          address: ''
     });

     const navigate = useNavigate();

     useEffect(() => {
          if (editingId) {
               const fetchEmployeeData = async () => {
                    try {
                         const employeeDoc = doc(db, 'users', editingId);
                         const employeeSnap = await getDoc(employeeDoc);
                         if (employeeSnap.exists()) {
                              setInitialValues(employeeSnap.data());
                         } else {
                              console.log("No such document!");
                         }
                    } catch (error) {
                         console.error("Error fetching document: ", error);
                    }
               };
               fetchEmployeeData();
          } else {
               setInitialValues({
                    name: '',
                    email: '',
                    phone: '',
                    address: ''
               });
          }
     }, [editingId]);

     const handleSubmit = async (values, { setSubmitting }) => {
          try {
               if (editingId) {
                    await updateDoc(doc(db, 'users', editingId), values);
                    setEmployees(prev => prev.map(emp => (emp.id === editingId ? { id: editingId, ...values } : emp)));
                    setEditingId(null);
               } else {
                    const docRef = await addDoc(collection(db, 'users'), {
                         ...values,
                         active: true,
                         fcmtoken: [],
                         groups: [],
                         role: ['employee']
                    });
                    setEmployees(prev => [...prev, { id: docRef.id, ...values }]);
               }
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
               setOpen(false);
          } catch (error) {
               console.error("Error adding Data", error);
               Swal.fire({
                    position: "middle",
                    icon: "error",
                    title: "Error adding Data",
                    showConfirmButton: false,
                    timer: 1500,
                    customClass: {
                         container: 'swal2-container-custom'
                    }
               });
          }
          setSubmitting(false);
     };

     const handleEdit = (id) => {
          setEditingId(id);
          setOpen(true);
     };

     const handleDelete = async (id) => {
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
                    setEmployees(prev => prev.filter(emp => emp.id !== id));
                    Swal.fire({
                         title: 'Deleted!',
                         text: 'The employee has been deleted.',
                         icon: 'success',
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               } catch (error) {
                    console.error("Error deleting document: ", error);
                    Swal.fire({
                         title: 'Error!',
                         text: 'There was an error deleting the employee.',
                         icon: 'error',
                         customClass: {
                              container: 'swal2-container-custom'
                         }
                    });
               }
          }
     };

     const handleViewDetail = (id) => {
          navigate(`/employee-details/${id}`);
     };

     const handleCancel = () => {
          setEditingId(null);
          setOpen(false);
     };

     const handleSearchChange = (e) => {
          setSearchQuery(e.target.value.toLowerCase());
     };

     const filteredEmployees = employees.filter(user =>
          user.name.toLowerCase().includes(searchQuery)
     );

     const tableRows = filteredEmployees.map(user => ({
          key: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          actions: (
               <>
                    <SoftButton variant="gradient" color="info" size="small" onClick={() => handleEdit(user.id)}>Edit</SoftButton>
                    <SoftButton variant="gradient" color="error" size="small" style={{ marginLeft: 10 }} onClick={() => handleDelete(user.id)}>Delete</SoftButton>
                    <SoftButton variant="gradient" color="primary" size="small" style={{ marginLeft: 10 }} onClick={() => handleViewDetail(user.id)}>View</SoftButton>
               </>
          ),
          hasBorder: true
     }));

     const tableColumns = [
          { name: "name", align: "left" },
          { name: "email", align: "left" },
          { name: "phone", align: "left" },
          { name: "address", align: "left" },
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
                              Add New Employee
                         </SoftButton>
                    </SoftBox>

                    <SoftBox>
                         {loading ? (
                              <SoftBox display="flex" justifyContent="center" alignItems="center" height="60vh">
                                   <CircularProgress />
                              </SoftBox>
                         ) : (
                              <>
                                   {employees.length > 0 ? (
                                        <Card sx={{ marginTop: 4 }}>
                                             <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                                                  <SoftTypography variant="h5">Employee List</SoftTypography>
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
                                        <p>No employees found</p>
                                   )}
                              </>
                         )}
                    </SoftBox>
               </SoftBox>

               <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
                    <DialogTitle>{editingId ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                    <DialogContent>
                         <Formik
                              initialValues={initialValues}
                              validationSchema={validationSchema}
                              onSubmit={handleSubmit}
                              enableReinitialize
                         >
                              {({ values, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                                   <FormikForm onSubmit={handleSubmit}>
                                        <SoftBox mb={1}>
                                             <SoftBox mb={1} ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Name
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="name"
                                                  placeholder="Enter name"
                                                  value={values.name}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                             />
                                             <ErrorMessage className="firmik-error" name="name" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>

                                        <SoftBox mb={1}>
                                             <SoftBox mb={1} ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       E-mail
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="email"
                                                  type="email"
                                                  placeholder="Enter email"
                                                  value={values.email}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                             />
                                             <ErrorMessage className="firmik-error" name="email" component="div" style={{ color: 'red', fontSize: 12 }} />

                                        </SoftBox>

                                        <SoftBox mb={1}>
                                             <SoftBox mb={1} ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Phone
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="phone"
                                                  placeholder="Enter phone number"
                                                  value={values.phone}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                             />
                                             <ErrorMessage className="firmik-error" name="phone" component="div" style={{ color: 'red', fontSize: 12 }} />

                                        </SoftBox>

                                        <SoftBox mb={1}>
                                             <SoftBox mb={1} ml={0.5}>
                                                  <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                       Address
                                                  </SoftTypography>
                                             </SoftBox>
                                             <Field
                                                  as={SoftInput}
                                                  name="address"
                                                  placeholder="Enter address"
                                                  value={values.address}
                                                  onChange={handleChange}
                                                  onBlur={handleBlur}
                                             />
                                             <ErrorMessage className="firmik-error" name="address" component="div" style={{ color: 'red', fontSize: 12 }} />

                                        </SoftBox>

                                        <DialogActions>
                                             <SoftButton
                                                  onClick={handleCancel}
                                                  variant="outlined"
                                                  color="secondary"
                                             >
                                                  Cancel
                                             </SoftButton>
                                             <SoftButton
                                                  type="submit"
                                                  variant="contained"
                                                  color="primary"
                                                  disabled={isSubmitting}
                                             >
                                                  {editingId ? 'Update' : 'Add'}
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

export default Employee;
