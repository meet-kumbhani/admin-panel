import React, { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import SoftBox from 'components/SoftBox';
import SoftButton from 'components/SoftButton';
import SoftInput from 'components/SoftInput';
import SoftTypography from 'components/SoftTypography';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import { Card } from 'react-bootstrap';
import { storage, db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Swal from 'sweetalert2';
import Table from 'examples/Tables/Table';
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Close } from '@mui/icons-material';
import { useGlobalContext } from '../../context/GlobalContext';

const Inbox = () => {
     const { fetchInboxData, inboxData, loading } = useGlobalContext();
     const [files, setFiles] = useState([]);
     const [open, setOpen] = useState(false);
     const [previews, setPreviews] = useState([]);
     const [searchQuery, setSearchQuery] = useState('');
     const [sending, setSending] = useState(false);

     const navigate = useNavigate();

     const handleFileChange = (event) => {
          const selectedFiles = Array.from(event.target.files);
          setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

          const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
          setPreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
     };

     const handleRemovePreview = (index) => {
          setFiles(files.filter((_, i) => i !== index));
          setPreviews(previews.filter((_, i) => i !== index));
     };

     const handleSubmit = async (values) => {
          const { name } = values;
          setSending(true);

          try {
               const fileUrls = await Promise.all(
                    files.map(async (file) => {
                         const storageRef = ref(storage, `images/${file.name}`);
                         await uploadBytes(storageRef, file);
                         return await getDownloadURL(storageRef);
                    })
               );

               await addDoc(collection(db, 'inbox'), {
                    title: name,
                    createdAt: serverTimestamp(),
                    imageUrls: fileUrls,
               });
               Swal.fire({
                    title: 'Success',
                    text: 'Files uploaded and data saved successfully!',
                    icon: 'success',
                    customClass: {
                         container: 'swal2-container-custom'
                    }
               });
               setFiles([]);
               setPreviews([]);
               setOpen(false);
               fetchInboxData();
          } catch (error) {
               Swal.fire('Error', error.message, 'error');
          } finally {
               setSending(false);
          }
     };

     const handleCancel = () => {
          setFiles([]);
          setPreviews([]);
          setOpen(false);
     };

     const handleViewDetail = (id) => {
          navigate(`/inbox-details/${id}`);
     };

     const handleSearchChange = (e) => {
          setSearchQuery(e.target.value.toLowerCase());
     };

     const filteredMessage = inboxData.filter(message =>
          message.title.toLowerCase().includes(searchQuery)
     );

     const tableRows = filteredMessage?.map(item => ({
          title: item.title,
          Date: item.createdAt,
          actions: (
               <SoftButton variant="gradient" color="primary" size="small" onClick={() => handleViewDetail(item.id)}>View</SoftButton>
          ),
          hasBorder: true
     }));

     const tableColumns = [
          { name: "title", align: "left" },
          { name: "Date", align: "left" },
          { name: "actions", align: "left" },
     ];

     const validationSchema = Yup.object().shape({
          name: Yup.string().required('Title is required'),
     });

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
                              Send New Message
                         </SoftButton>
                    </SoftBox>

                    <SoftBox marginTop={4}>
                         {loading ? (
                              <SoftBox display="flex" justifyContent="center" alignItems="center" height="60vh">
                                   <CircularProgress />
                              </SoftBox>
                         ) : (
                              <>
                                   {inboxData.length > 0 ? (
                                        <Card>
                                             <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                                                  <SoftTypography variant="h5">Messages</SoftTypography>
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
                                        <p>No data found</p>
                                   )}
                              </>
                         )}

                    </SoftBox>
               </SoftBox>

               <Dialog open={open} onClose={handleCancel} fullWidth maxWidth="md">
                    <DialogTitle>Add Message</DialogTitle>
                    <DialogContent>
                         <Formik
                              initialValues={{ name: '' }}
                              validationSchema={validationSchema}
                              onSubmit={handleSubmit}
                         >
                              {({ handleSubmit, handleChange, values, touched, errors }) => (
                                   <Form onSubmit={handleSubmit}>
                                        <SoftBox mb={0.5}>
                                             <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                  Title
                                             </SoftTypography>
                                             <Field
                                                  as={SoftInput}
                                                  placeholder="Title"
                                                  name="name"
                                                  value={values.name}
                                                  onChange={handleChange}
                                                  fullWidth
                                                  multiline
                                                  rows={1}
                                                  error={touched.name && errors.name}
                                                  helperText={touched.name && errors.name}
                                             />
                                             <ErrorMessage className="firmik-error" name="name" component="div" style={{ color: 'red', fontSize: 12 }} />
                                        </SoftBox>
                                        <SoftBox>
                                             <SoftTypography component="label" variant="caption" fontWeight="bold">
                                                  Upload image
                                             </SoftTypography>
                                             <input
                                                  type="file"
                                                  className='form-control'
                                                  multiple
                                                  onChange={handleFileChange}
                                             />
                                        </SoftBox>
                                        <SoftBox mt={2}>
                                             {previews.length > 0 && (
                                                  <SoftBox display="flex" flexWrap="wrap">
                                                       {previews?.map((preview, index) => (
                                                            <SoftBox key={index} position="relative" mr={2} mb={2}>
                                                                 <img
                                                                      src={preview}
                                                                      alt={`Preview ${index}`}
                                                                      style={{ width: '100px', height: '100px', borderRadius: '8px' }}
                                                                 />
                                                                 <IconButton
                                                                      onClick={() => handleRemovePreview(index)}
                                                                      style={{
                                                                           position: 'absolute',
                                                                           top: 0,
                                                                           padding: 0,
                                                                           right: 0,
                                                                      }}
                                                                 >
                                                                      <Close />
                                                                 </IconButton>
                                                            </SoftBox>
                                                       ))}
                                                  </SoftBox>
                                             )}
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
                                                  disabled={sending}
                                             >
                                                  {sending ? 'Sending...' : 'Send'}
                                             </SoftButton>
                                        </DialogActions>
                                   </Form>
                              )}
                         </Formik>
                    </DialogContent>
               </Dialog>
          </DashboardLayout>
     );
};

export default Inbox;
