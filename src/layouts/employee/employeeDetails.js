import SoftBox from 'components/SoftBox'
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout'
import { useNavigate, useParams } from 'react-router-dom'
import SoftTypography from 'components/SoftTypography'
import Table from 'examples/Tables/Table'
import { Card, CircularProgress } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useGlobalContext } from '../../context/GlobalContext'

const EmployeeDetails = () => {
     const { id } = useParams();
     const { loading, employees, attendanceRecords } = useGlobalContext();
     const navigate = useNavigate()

     const handleBack = () => {
          navigate(-1);
     };

     const matchingAttendance = attendanceRecords.filter(e => e.userId === id);
     const filteredEmployees = employees?.filter(e => e.id == id)
     const employeeDetails = filteredEmployees?.map((employee) => ({
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          address: employee.address,
     }))[0];

     const tableRows = matchingAttendance.map(data => {
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
                    <SoftBox display="flex" alignItems="baseline">
                         <ArrowBackIosNewIcon sx={{ marginRight: 2, cursor: "pointer" }} onClick={handleBack} />
                         <SoftTypography variant="h4" gutterBottom>
                              Employee Details
                         </SoftTypography>
                    </SoftBox>

                    <Card sx={{ marginTop: 3 }}>
                         <SoftBox p={3}>
                              <SoftTypography variant="h5"><strong>Employee Name:</strong> {employeeDetails?.name}</SoftTypography>
                              <SoftBox mt={2}>
                                   <SoftTypography variant="h6"><strong>Employee Email:</strong> {employeeDetails?.email}</SoftTypography>
                                   <SoftTypography variant="h6"><strong>Employee Phone:</strong> {employeeDetails?.phone}</SoftTypography>
                                   <SoftTypography variant="h6"><strong>Employee Address:</strong> {employeeDetails?.address}</SoftTypography>
                              </SoftBox>
                         </SoftBox>
                    </Card>

               </SoftBox>

               <SoftBox>
                    {loading ? (
                         <SoftBox display="flex" justifyContent="center" alignItems="center" height="60vh">
                              <CircularProgress />
                         </SoftBox>
                    ) : (
                         <>
                              {matchingAttendance.length > 0 ? (
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
                                        <SoftTypography variant="h4">No Attendance found</SoftTypography>
                                   </SoftBox>
                              )
                              }
                         </>
                    )}


               </SoftBox>
          </DashboardLayout >
     );
};

export default EmployeeDetails;
