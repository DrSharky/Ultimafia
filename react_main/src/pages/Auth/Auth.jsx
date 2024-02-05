import React, { useContext, useState, useEffect } from "react";
import { Redirect, Switch, Route, useLocation } from "react-router-dom";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  inMemoryPersistence,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import axios from "axios";
import { useErrorAlert } from "../../components/Alerts";

import LogIn from "./LogIn";
import SignUp from "./SignUp";
import { UserContext } from "../../Contexts";
import { SubNav } from "../../components/Nav";
import LoadingPage from "../Loading";

import "../../css/auth.css";

export default function Auth() {
  const user = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const errorAlert = useErrorAlert();
  const links = [
    {
      text: "Log In",
      path: "/auth/login",
      exact: true,
    },
    {
      text: "Sign Up",
      path: "/auth/signup",
      exact: true,
    },
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("ref"))
      window.localStorage.setItem("referrer", params.get("ref"));

    const fbConfig = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID,
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    };

    initializeApp(fbConfig);
    const auth = getAuth();
    auth.setPersistence(inMemoryPersistence);

    getRedirectResult(auth).then(async (result) => {
      if (result && result.user) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const idToken = await auth.currentUser.getIdToken(true);
        axios
          .post("/auth", { idToken })
          .then(() => {
            window.location.reload();
          })
          .catch((e) => {
            errorAlert(e);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (!user.loaded || loading) return <LoadingPage />;
  else if (user.loggedIn) return <Redirect to="/play" />;

  return (
    <>
      <SubNav links={links} />
      <div className="auth inner-content">
        <Switch>
          {/* <Route exact path="/auth/login">
            <LogIn />
          </Route> */}
          <Route exact path="/auth/signup">
            <SignUp />
          </Route>
          {/* <Route render={() => <Redirect to="/auth/login" />} /> */}
        </Switch>
      </div>
    </>
  );
}
