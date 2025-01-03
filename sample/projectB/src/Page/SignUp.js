import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import GoogleButton from "react-google-button";
import { TextField } from "@mui/material";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import {
  auth,
  registerWithEmailAndPassword,
  signInWithGoogle,
} from "../Firebase/service";

import "../Styles/SignUp.css";

function SignUp() {
  const navigate = useNavigate();
  const [name, loaded, error] = useAuthState(auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const register = () => {
    if (!nickname) alert("닉네임을 입력하세요");
    registerWithEmailAndPassword(nickname, email, password);
  };

  useEffect(() => {
    if (loaded) return;
    if (name) navigate("/home", { replace: true });
  }, [name, loaded]);

  return (
    <div className="register">
      <div className="register-container">
        <TextField
          label="Nickname"
          sx={{ width: 260, height: 40, marginBottom: 3 }}
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Full Name"
        />
        <TextField
          label="Email"
          sx={{ width: 260, height: 40, marginBottom: 3 }}
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="yours@example.com"
        />
        <TextField
          label="Password"
          sx={{ width: 260, height: 40, marginBottom: 5 }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <Button
          variant="contained"
          sx={{ width: 260, height: 40, marginBottom: 2 }}
          onClick={register}
        >
          회원가입
        </Button>
        <GoogleButton
          onClick={signInWithGoogle}
          style={{ marginBottom: 20, width: 260 }}
        />
        <Link underline="hover" component={RouterLink} to="/">
          로그인
        </Link>
      </div>
    </div>
  );
}

export default SignUp;
