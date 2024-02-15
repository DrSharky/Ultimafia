import React from "react";
import { useRouter } from "next/navigation";
import Link, { LinkProps } from "next/link";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { NewMain } from "./NewMain";

ReactDOM.render(
  <Router>
    <NewMain />
  </Router>,
  document.getElementById("root")
);
