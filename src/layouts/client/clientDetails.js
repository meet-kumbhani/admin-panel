import React, { useRef, useState } from 'react';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { useNavigate, useParams } from 'react-router-dom';;
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import location from "../../assets/images/location.png";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { useGlobalContext } from '../../context/GlobalContext';

const ClientDetails = () => {
     const { id } = useParams();
     const { evidenceList, locations } = useGlobalContext();
     const [selectedLocation, setSelectedLocation] = useState(null);
     const mapRef = useRef(null);
     const navigate = useNavigate();

     const customIcon = L.icon({
          iconUrl: location,
          iconSize: [40, 40],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
     });

     const handleImageClick = (lat, lng) => {
          setSelectedLocation({ lat, lng });
          if (mapRef.current) {
               mapRef.current.setView([lat, lng], 13);
          }
     };

     const handleBack = () => {
          navigate(-1);
     };

     const matchingEvidence = evidenceList.filter(e => e.userId === id);

     return (
          <DashboardLayout>
               <SoftBox>
                    <SoftBox display="flex" alignItems="baseline" gap={2}>
                         <ArrowBackIosNewIcon sx={{ cursor: "pointer" }} onClick={handleBack} />
                         <SoftTypography variant="h4" gutterBottom>
                              Client Details
                         </SoftTypography>
                    </SoftBox>

                    <SoftBox mt={2} display="flex" height="calc(100vh - 100px)" gap={1}>
                         {matchingEvidence.length > 0 ? (
                              <>
                                   <SoftBox flex="1" display="flex" flexDirection="column" gap="20px" maxHeight="100%" overflow="auto">
                                        {matchingEvidence.map((evidence, index) => (
                                             evidence.evidence.map((attachment) => (
                                                  <SoftTypography key={attachment.url} onClick={() => handleImageClick(attachment.lat, attachment.lng)} style={{ cursor: 'pointer' }}>
                                                       <img src={attachment.url} alt="" width="100%" style={{ marginBottom: '10px' }} />
                                                       <SoftTypography>
                                                            <strong>Location:</strong> {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                                       </SoftTypography>
                                                       <p><strong>Message:</strong> {evidence.message}</p>
                                                  </SoftTypography>
                                             ))
                                        ))}
                                   </SoftBox>
                                   <SoftBox flex="2">
                                        <MapContainer center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [matchingEvidence[0].evidence[0].lat, matchingEvidence[0].evidence[0].lng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                                             <TileLayer
                                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                             />
                                             {matchingEvidence.map((evidence) => (
                                                  evidence.evidence.map((attachment) => (
                                                       <Marker key={`${attachment.lat},${attachment.lng}`} position={[attachment.lat, attachment.lng]} icon={customIcon}>
                                                            <Popup>
                                                                 <img src={attachment.url} alt="" width={200} /><br />
                                                                 Location: {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                                            </Popup>
                                                       </Marker>
                                                  ))
                                             ))}
                                        </MapContainer>
                                   </SoftBox>
                              </>
                         ) : (
                              <SoftBox mt={4} sx={{ display: "flex", justifyContent: "center", height: "80vh", alignItems: "center" }}>
                                   <SoftTypography variant="h4">No matching evidence found.</SoftTypography>
                              </SoftBox>
                         )}
                    </SoftBox>
               </SoftBox>
          </DashboardLayout>

     );
};

export default ClientDetails;
