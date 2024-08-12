import React, { useEffect, useState, useRef } from 'react';
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import SoftBox from 'components/SoftBox';
import SoftTypography from 'components/SoftTypography';
import { Card } from '@mui/material';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './inbox.css';
import SoftButton from 'components/SoftButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const InboxDetails = () => {
     const [message, setMessage] = useState(null);
     const { id } = useParams();
     const sliderRef = useRef(null);
     const navigate = useNavigate();

     useEffect(() => {
          const fetchInboxData = async () => {
               try {
                    const docRef = doc(db, 'inbox', id);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                         setMessage(docSnap.data());
                    } else {
                         console.error('No such document!');
                    }
               } catch (error) {
                    console.error('Error fetching document: ' + error.message);
               }
          };

          fetchInboxData();
     }, [id]);

     const settings = {
          dots: false,
          infinite: false,
          speed: 500,
          slidesToShow: 4,
          slidesToScroll: 1,
     };

     const handleNext = () => {
          sliderRef.current.slickNext();
     };

     const handlePrev = () => {
          sliderRef.current.slickPrev();
     };

     const handleBack = () => {
          navigate(-1);
     };

     return (
          <DashboardLayout>
               <SoftBox pt={4}>
                    <SoftBox display="flex" gap={2}>
                         <SoftTypography>
                              <ArrowBackIosNewIcon sx={{ cursor: "pointer" }} onClick={handleBack} />
                         </SoftTypography>
                         <SoftTypography variant="h4" gutterBottom>
                              Inbox
                         </SoftTypography>
                    </SoftBox>

                    <SoftBox mt={2}>
                         {message ? (
                              <Card className='p-3'>
                                   <SoftBox>
                                        <SoftBox>
                                             {message.imageUrls && message.imageUrls.length > 0 ? (
                                                  <>
                                                       <Slider ref={sliderRef} {...settings}>
                                                            {message.imageUrls.map((imageUrl, index) => (
                                                                 <div key={index} className="slick-slide">
                                                                      <img
                                                                           src={imageUrl}
                                                                           alt={`image-${index}`}
                                                                           className='img-fluid inbox-image'
                                                                      />
                                                                 </div>
                                                            ))}
                                                       </Slider>

                                                       {message.imageUrls.length > 4 && (
                                                            <SoftBox display="flex" justifyContent="space-between" mt={2}>
                                                                 <SoftButton onClick={handlePrev} variant="gradient" color="light"><ArrowBackIosNewIcon /></SoftButton>
                                                                 <SoftButton onClick={handleNext} variant="gradient" color="light"><ArrowForwardIosIcon /></SoftButton>
                                                            </SoftBox>
                                                       )}
                                                  </>
                                             ) : (
                                                  <SoftTypography>No images available</SoftTypography>
                                             )}
                                             <SoftTypography mt={2}><strong>Title: </strong> {message.title}</SoftTypography>
                                             <SoftTypography><strong>Date:</strong> {new Date(message.createdAt.seconds * 1000).toLocaleDateString()}</SoftTypography>
                                        </SoftBox>
                                   </SoftBox>
                              </Card>
                         ) : (
                              <SoftTypography>Loading...</SoftTypography>
                         )}
                    </SoftBox>
               </SoftBox>
          </DashboardLayout>
     );
};

export default InboxDetails;
