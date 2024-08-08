import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc, doc } from 'firebase/firestore';
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
import { Card } from '@mui/material';


const Employee = () => {
     const [formData, setFormData] = useState({
          name: '',
          email: '',
          phone: '',
          address: ''
     });
     const [employee, setEmployee] = useState([]);
     const [editingId, setEditingId] = useState(null);
     const navigate = useNavigate()

     const handleChange = (e) => {
          const { name, value } = e.target;
          setFormData({ ...formData, [name]: value });
     };

     const handleSubmit = async (e) => {
          e.preventDefault();

          try {
               if (editingId) {
                    await updateDoc(doc(db, 'users', editingId), formData);
                    setEditingId(null);
               } else {
                    await addDoc(collection(db, 'users'), {
                         ...formData,
                         active: true,
                         fcmtoken: [],
                         groups: [],
                         role: ['employee']
                    });
               }
               setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: ''
               });
          } catch (error) {
               console.error("Error adding/updating document: ", error);
          }
     };

     const handleEdit = (id) => {
          const userToEdit = employee.find(user => user.id === id);
          setFormData(userToEdit);
          setEditingId(id);
     };

     const handleDelete = async (id) => {
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
                    Swal.fire(
                         'Deleted!',
                         'The employee has been deleted.',
                         'success'
                    );
               } catch (error) {
                    console.error("Error deleting document: ", error);
                    Swal.fire(
                         'Error!',
                         'There was an error deleting the employee.',
                         'error'
                    );
               }
          }
     };

     useEffect(() => {
          const q = query(collection(db, 'users'), where('role', 'array-contains', 'employee'));
          const unsubscribe = onSnapshot(q, (snapshot) => {
               const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
               setEmployee(userList);
          });

          return () => unsubscribe();
     }, []);

     const handleViewDetail = (id) => {
          navigate(`/employee-details/${id}`);
     };


     const tableRows = employee.map(user => ({
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
               <form onSubmit={handleSubmit}>
                    <SoftBox mb={1}>
                         <SoftBox mb={1} ml={0.5}>
                              <SoftTypography component="label" variant="caption" fontWeight="bold">
                                   Name
                              </SoftTypography>
                         </SoftBox>
                         <SoftInput
                              name="name"
                              value={formData.name}
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
                              value={formData.email}
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
                              value={formData.phone}
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
                              value={formData.address}
                              onChange={handleChange}
                              placeholder="Enter address"
                         />
                    </SoftBox>

                    <SoftButton variant="gradient" color="info" type="submit">
                         {editingId ? 'Update' : 'Submit'}
                    </SoftButton>
               </form>

               {employee.length > 0 ? (
                    <Card sx={{ marginTop: 5 }}>
                         <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                              <SoftTypography variant="h5">Employee List</SoftTypography>
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
          </DashboardLayout>
     );
};

export default Employee;
