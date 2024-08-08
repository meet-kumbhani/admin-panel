import React, { useEffect, useRef, useState } from 'react';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { useParams } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import location from "../../assets/images/location.png"

const ClientDetails = () => {
     const { id } = useParams()
     const [evidence, setEvidence] = useState(null);
     const [locations, setLocations] = useState({});
     const [selectedLocation, setSelectedLocation] = useState(null);
     const mapRef = useRef(null);

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
                    const matchingEvidence = updatedEvidenceData.find(e => e.userId === id);
                    setEvidence(matchingEvidence);
                    if (matchingEvidence && matchingEvidence.evidence) {
                         fetchLocations(matchingEvidence.evidence);
                    }
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
          setLocations(newLocations);
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

     return (
          <DashboardLayout>
               <SoftBox>
                    <SoftTypography variant="h4" gutterBottom>
                         Client Details
                    </SoftTypography>
                    <SoftTypography>
                         {evidence ? (
                              <SoftBox>
                                   <SoftBox style={{ display: 'flex', gap: '20px' }}>
                                        <SoftTypography style={{ flex: '1' }}>
                                             {evidence?.evidence?.map((attachment) => (
                                                  <SoftTypography key={attachment.url} onClick={() => handleImageClick(attachment.lat, attachment.lng)} style={{ cursor: 'pointer' }}>
                                                       <img src={attachment.url} alt="" width="100%" style={{ marginBottom: '10px' }} />
                                                       <SoftTypography>
                                                            <strong>Location:-</strong> {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                                       </SoftTypography>
                                                       <p><strong>Message:- </strong>{evidence.message}</p>
                                                  </SoftTypography>
                                             ))}
                                        </SoftTypography>
                                        <SoftBox style={{ flex: '2' }}>
                                             <MapContainer center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : [evidence.evidence[0].lat, evidence.evidence[0].lng]} zoom={13} style={{ height: '500px', width: '100%' }} ref={mapRef}>
                                                  <TileLayer
                                                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                  />
                                                  {evidence?.evidence?.map((attachment) => (
                                                       <Marker key={`${attachment.lat},${attachment.lng}`} position={[attachment.lat, attachment.lng]} icon={customIcon}>
                                                            <Popup>
                                                                 <img src={attachment.url} alt="" width={200} /><br />
                                                                 Location: {locations[`${attachment.lat},${attachment.lng}`] || 'Loading...'}
                                                            </Popup>
                                                       </Marker>
                                                  ))}
                                             </MapContainer>
                                        </SoftBox>
                                   </SoftBox>
                              </SoftBox>
                         ) : (
                              <SoftBox mt={4} sx={{ display: "flex", justifyContent: "center", height: "80vh", alignItems: "center" }}>
                                   <SoftTypography variant="h4">No matching evidence found.</SoftTypography>
                              </SoftBox>
                         )}
                    </SoftTypography>
               </SoftBox>
          </DashboardLayout>
     );
};

export default ClientDetails;
