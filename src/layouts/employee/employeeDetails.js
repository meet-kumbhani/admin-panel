import SoftBox from 'components/SoftBox'
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout'
import { db } from '../../firebase/config'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import SoftTypography from 'components/SoftTypography'
import Table from 'examples/Tables/Table'
import { Card } from '@mui/material'

const GOOGLE_MAPS_API_KEY = 'AIzaSyBHyngtjTulkJ96GKevrg7jpxwypD1Kx-k';

const reverseGeocode = async (lat, lng) => {
     try {
          const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
          const data = await response.json();
          if (data.results.length > 0) {
               return data.results[0].formatted_address;
          }
          return 'Unknown location';
     } catch (error) {
          console.error('Error in reverse geocoding: ', error);
          return 'Error fetching location';
     }
};

const EmployeeDetails = () => {
     const { id } = useParams();
     const [employee, setEmployee] = useState(null);
     const [attendanceRecords, setAttendanceRecords] = useState([]);
     console.log(attendanceRecords, "<-- records");


     useEffect(() => {
          const fetchEmployee = async () => {
               try {
                    const docRef = doc(db, 'users', id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                         setEmployee(docSnap.data());
                    } else {
                         console.log('No such document!');
                    }
               } catch (error) {
                    console.error('Error fetching document: ', error);
               }
          };

          fetchEmployee();
     }, [id]);

     useEffect(() => {
          const fetchAttendance = async () => {
               try {
                    const attendanceQuery = query(collection(db, 'attendance'), where('userId', '==', id));
                    const querySnapshot = await getDocs(attendanceQuery);
                    const attendanceList = await Promise.all(querySnapshot.docs.map(async (doc) => {
                         const data = doc.data();
                         const startLocationName = data.startLocation ? await reverseGeocode(data.startLocation.latitude, data.startLocation.longitude) : 'Unknown';
                         const endLocationName = data.endLocation ? await reverseGeocode(data.endLocation.latitude, data.endLocation.longitude) : 'Unknown';
                         const submitLocationName = data.submitLocation ? await reverseGeocode(data.submitLocation.latitude, data.submitLocation.longitude) : 'Unknown';

                         return {
                              ...data,
                              startLocation: startLocationName,
                              endLocation: endLocationName,
                              submitLocation: submitLocationName,
                         };
                    }));
                    setAttendanceRecords(attendanceList);
               } catch (error) {
                    console.error('Error fetching attendance records: ', error);
               }
          };

          fetchAttendance();
     }, [id]);

     const tableRows = attendanceRecords.map(data => {
          const startTime = new Date(data.startTime);
          const endTime = new Date(data.endTime);
          const durationMs = endTime - startTime;

          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

          const formattedDuration = `${hours}h ${minutes}m ${seconds}s`;

          return {
               StartTime: startTime.toLocaleString(),
               EndTime: endTime.toLocaleString(),
               StartLocation: data.startLocation,
               EndLocation: data.endLocation,
               SubmitLocation: data.submitLocation,
               TotalTime: formattedDuration,
               hasBorder: true
          };
     });

     console.log(tableRows, "<-- table data");


     const tableColumns = [
          { name: "StartTime", align: "left" },
          { name: "EndTime", align: "left" },
          { name: "StartLocation", align: "left" },
          { name: "EndLocation", align: "left" },
          { name: "SubmitLocation", align: "left" },
          { name: "TotalTime", align: "left" },
     ];

     return (
          <DashboardLayout>
               <SoftBox pt={3}>
                    <SoftTypography variant="h4" gutterBottom>
                         Employee Details
                    </SoftTypography>

                    {employee && (
                         <Card sx={{ marginTop: 5 }}>
                              <SoftTypography sx={{ padding: 2 }}><strong>Employee Name:</strong> {employee.name}</SoftTypography>
                         </Card>
                    )}

               </SoftBox>


               {attendanceRecords.length > 0 ? (
                    <Card sx={{ marginTop: 4 }}>
                         <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                              <SoftTypography variant="h5">Attendance List</SoftTypography>
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
                    <SoftBox sx={{ display: "flex", justifyContent: "center", height: "60vh", alignItems: "center" }}>
                         <SoftTypography variant="h4">No employees found</SoftTypography>
                    </SoftBox>
               )
               }
          </DashboardLayout >
     );
};

export default EmployeeDetails;
