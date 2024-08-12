import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import location from "../../assets/images/location.png";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const ClientDetails = () => {
     const { id } = useParams();
     const [evidenceList, setEvidenceList] = useState([]);
     const [locations, setLocations] = useState({});
     const [selectedLocation, setSelectedLocation] = useState(null);
     const mapRef = useRef(null);
     const navigate = useNavigate();

     const GOOGLE_MAPS_API_KEY = 'AIzaSyBHyngtjTulkJ96GKevrg7jpxwypD1Kx-k';

     const customIcon = L.icon({
          iconUrl: location,
          iconSize: [40, 40],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
     });

     useEffect(() => {
          const getEvidence = () => {
               const evidenceCollection = collection(db, "evidence");
               const unsubscribeEvidence = onSnapshot(evidenceCollection, (snapshot) => {
                    const updatedEvidenceData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    const matchingEvidence = updatedEvidenceData.filter(e => e.userId === id);
                    setEvidenceList(matchingEvidence);
                    matchingEvidence.forEach(evidence => {
                         if (evidence.evidence) {
                              fetchLocations(evidence.evidence);
                         }
                    });
               });
               return () => unsubscribeEvidence();
          };
          getEvidence();
     }, [id]);

     const fetchLocations = async (attachments) => {
          const newLocations = {};
          for (const attachment of attachments) {
               const locationName = await getLocationName(attachment.lat, attachment.lng);
               newLocations[`${attachment.lat},${attachment.lng}`] = locationName;
          }
          setLocations(prevLocations => ({ ...prevLocations, ...newLocations }));
     };

     const getLocationName = async (lat, lng) => {
          try {
               const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`);
               if (response.data.status === 'OK') {
                    const addressComponents = response.data.results[0].address_components;
                    let city = '';
                    let state = '';

                    for (const component of addressComponents) {
                         if (component.types.includes('locality')) {
                              city = component.long_name;
                         }
                         if (component.types.includes('administrative_area_level_1')) {
                              state = component.long_name;
                         }
                    }
                    return `${city}, ${state}`;
               } else {
                    return 'Unknown location';
               }
          } catch (error) {
               console.error('Error fetching location name:', error);
               return 'Error fetching location';
          }
     };

     const handleImageClick = (lat, lng) => {
          setSelectedLocation({ lat, lng });
          if (mapRef.current) {
               mapRef.current.setView([lat, lng], 13);
          }
     };

     const handleBack = () => {
          navigate(-1);
     };

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
                         {evidenceList.length > 0 ? (
                              <>
                                   <SoftBox flex="1" display="flex" flexDirection="column" gap="20px" maxHeight="100%" overflow="auto">
                                        {evidenceList.map((evidence, index) => (
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
                                        <MapContainer center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [evidenceList[0].evidence[0].lat, evidenceList[0].evidence[0].lng]} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
                                             <TileLayer
                                                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                             />
                                             {evidenceList.map((evidence) => (
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
