import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthed } from "../lib/auth";
export default function ProtectedRoute({ children }){ return isAuthed() ? children : <Navigate to="/signin" replace/>; }
