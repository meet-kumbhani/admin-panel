import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import curved9 from "assets/images/curved-images/curved-6.jpg";
import PhoneInput from "react-phone-input-2";
import 'react-phone-input-2/lib/style.css';
import { auth, db } from "../../../firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { CircularProgress } from "@mui/material";

function SignIn() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [signInLoading, setSignInLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const oncaptchaverify = () => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
  };

  const onSignup = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setError("");

    const formatPh = "+" + phone;

    oncaptchaverify();
    const appVerifier = window.recaptchaVerifier;

    try {
      const confirmationResult = await signInWithPhoneNumber(auth, formatPh, appVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      console.log("Otp Sent");
    } catch (error) {
      console.error("Error during signInWithPhoneNumber:", error);
      setError("Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const OtpVerify = async (e) => {
    e.preventDefault();
    setSignInLoading(true);
    setError("");

    try {
      const confirmationResult = window.confirmationResult;
      const res = await confirmationResult.confirm(otp);
      const userPhone = res.user.phoneNumber;

      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("phone", "==", userPhone));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found in our records.");
      } else {
        const user = querySnapshot.docs[0].data();
        if (user.role && user.role.includes("admin")) {
          navigate("/client");
        } else {
          setError("This user is not an admin.");
        }
      }
    } catch (err) {
      console.log(err);
      setError("Invalid OTP.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setSignInLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const usersCollection = collection(db, "users");
      const q = query(usersCollection, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found in our records.");
      } else {
        const userData = querySnapshot.docs[0].data();
        if (userData.role && userData.role.includes("admin")) {
          navigate("/client");
        } else {
          setError("This user is not an admin.");
        }
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      setError("Google sign-in failed.");
    } finally {
      setSignInLoading(false);
    }
  };

  return (
    <CoverLayout title="Welcome back" image={curved9}>
      <SoftBox component="form" role="form">
        <SoftBox>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              PhoneNumber
            </SoftTypography>
          </SoftBox>
          <PhoneInput
            country={'in'}
            value={phone}
            onChange={phone => setPhone(phone)}
            inputStyle={{ width: '100%' }}
            placeholder="Enter Phone.."
            disabled={isOtpSent}
          />

          <SoftTypography id="recaptcha-container"></SoftTypography>
          <SoftBox mt={1} style={{ display: "flex", justifyContent: "end" }}>
            {otpLoading ? (
              <SoftBox>
                <CircularProgress size={20} sx={{ color: "#2152ff" }} />
              </SoftBox>
            ) : (
              <SoftButton variant="gradient" color="info" onClick={onSignup} disabled={isOtpSent} size={"small"}>
                Send OTP
              </SoftButton>
            )}

          </SoftBox>

        </SoftBox>

        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" size={"large"}>
              OTP
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={!isOtpSent}
          />
        </SoftBox>
        {error && <SoftTypography color="error">{error}</SoftTypography>}
        <SoftBox mt={4} mb={1}>
          <SoftButton variant="gradient" color="info" fullWidth disabled={!isOtpSent} onClick={OtpVerify}>
            {signInLoading ? <CircularProgress size={16} color="white" /> : "Sign In"}
          </SoftButton>
        </SoftBox>
        <SoftBox mt={2} mb={1}>
          <SoftButton variant="gradient" color="success" fullWidth onClick={handleGoogleSignIn}>
            Sign in with Google
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </CoverLayout>
  );
}

export default SignIn;
