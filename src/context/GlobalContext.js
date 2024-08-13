import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { collection, query, getDocs, where, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import axios from 'axios';

const GlobalContext = createContext();

export const useGlobalContext = () => useContext(GlobalContext);

export const GlobalProvider = ({ children }) => {
     const [users, setUsers] = useState([]);
     const [employees, setEmployees] = useState([]);
     const [loading, setLoading] = useState(true);
     const [evidenceList, setEvidenceList] = useState([]);
     const [attendanceRecords, setAttendanceRecords] = useState([]);
     const [inboxData, setInboxData] = useState([]);
     const [locations, setLocations] = useState({});
     const [authuser, setAuthuser] = useState(null);

     const GOOGLE_MAPS_API_KEY = 'AIzaSyBHyngtjTulkJ96GKevrg7jpxwypD1Kx-k';

     useEffect(() => {
          const authuser = auth.onAuthStateChanged((user) => {
               console.log(user, "<-- this is user");

               setAuthuser(user);
               setLoading(false);
          });
          return () => authuser();
     }, []);

     useEffect(() => {
          if (!authuser) {
               return;
          }

          (async () => {
               try {
                    const usersCollection = collection(db, "users");
                    const q = query(usersCollection, where("role", "array-contains", "employee"));
                    const querySnapshot = await getDocs(q);
                    const employeeList = querySnapshot.docs.map(doc => ({
                         id: doc.id,
                         ...doc.data()
                    }));
                    employeeList.sort((a, b) => a.name.localeCompare(b.name));
                    setEmployees(employeeList);
               } catch (error) {
                    console.error("Error fetching employees: ", error);
               }
          })();

          (() => {
               const evidenceCollection = collection(db, "evidence");
               const unsubscribeEvidence = onSnapshot(evidenceCollection, (snapshot) => {
                    const updatedEvidenceData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                    setEvidenceList(updatedEvidenceData);
                    updatedEvidenceData.forEach(evidence => {
                         if (evidence.evidence) {
                              fetchLocations(evidence.evidence);
                         }
                    });
               });
               return () => unsubscribeEvidence();
          })();

          (async () => {
               try {
                    const attendanceQuery = query(collection(db, 'attendance'));
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
                    setLoading(false)
               } catch (error) {
                    console.error('Error fetching attendance records: ', error);
               }
          })();

          fetchClientData();
          fetchInboxData()
     }, [authuser]);

     //get client

     const fetchClientData = async () => {
          const getUserData = async () => {
               try {
                    const usersCollection = collection(db, "users");
                    const q = query(usersCollection);
                    const querySnapshot = await getDocs(q);
                    const allUsers = [];

                    for (const doc of querySnapshot.docs) {
                         const userdata = doc.data();
                         const userId = doc.id;
                         const clientsCollection = collection(db, "clients");
                         const clientQuery = query(clientsCollection, where("userId", "==", userId));
                         const clientSnapshot = await getDocs(clientQuery);

                         const clients = clientSnapshot.docs.map((clientDoc) => ({
                              ...clientDoc.data(),
                              id: clientDoc.id,
                              createdat: clientDoc.data().createdat.toDate(),
                         }));

                         allUsers.push({ ...userdata, id: userId, clients });
                    }

                    setUsers(allUsers);
               } catch (error) {
                    console.error("Error", error);
               }
          };

          getUserData();
     };

     // get inboxData

     const fetchInboxData = async () => {
          try {
               const querySnapshot = await getDocs(collection(db, 'inbox'));
               const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt.toDate()
               }));
               const sortedData = data.sort((a, b) => b.createdAt - a.createdAt);

               const formattedData = sortedData.map(item => ({
                    ...item,
                    createdAt: item.createdAt.toLocaleDateString()
               }));
               setInboxData(formattedData);
               setLoading(false);
          } catch (error) {
               Swal.fire('Error', error.message, 'error');
          }
     };


     //get location

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

     return (
          <GlobalContext.Provider value={{ authuser, users, employees, setEmployees, loading, fetchClientData, evidenceList, locations, attendanceRecords, setAttendanceRecords, inboxData, fetchInboxData }}>
               {children}
          </GlobalContext.Provider>
     );
};

GlobalProvider.propTypes = {
     children: PropTypes.node.isRequired,
};
