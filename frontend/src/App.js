import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LightsOutViewer from "@/components/LightsOutViewer";
import LumaChat from "@/components/LumaChat";

import Landing from "@/pages/Landing";
import Portfolio from "@/pages/Portfolio";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import BookSession from "@/pages/BookSession";

import CustomerDashboard from "@/pages/CustomerDashboard";
import CustomerBookings from "@/pages/CustomerBookings";
import CustomerGalleries from "@/pages/CustomerGalleries";
import CustomerGalleryView from "@/pages/CustomerGalleryView";
import CustomerDocuments from "@/pages/CustomerDocuments";
import CustomerInvoices from "@/pages/CustomerInvoices";

import AdminDashboard from "@/pages/AdminDashboard";
import AdminOverview from "@/pages/AdminOverview";
import AdminBookings from "@/pages/AdminBookings";
import AdminClients from "@/pages/AdminClients";
import AdminGalleries from "@/pages/AdminGalleries";
import AdminDocuments from "@/pages/AdminDocuments";
import AdminInvoices from "@/pages/AdminInvoices";
import AdminPortfolio from "@/pages/AdminPortfolio";
import AdminServices from "@/pages/AdminServices";

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Landing />} />
                            <Route path="/portfolio" element={<Portfolio />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/book" element={<BookSession />} />

                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute role="user">
                                        <CustomerDashboard />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="bookings" replace />} />
                                <Route path="bookings" element={<CustomerBookings />} />
                                <Route path="galleries" element={<CustomerGalleries />} />
                                <Route path="documents" element={<CustomerDocuments />} />
                                <Route path="invoices" element={<CustomerInvoices />} />
                            </Route>
                            <Route
                                path="/dashboard/galleries/:id"
                                element={
                                    <ProtectedRoute role="user">
                                        <CustomerGalleryView />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute role="admin">
                                        <AdminDashboard />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Navigate to="overview" replace />} />
                                <Route path="overview" element={<AdminOverview />} />
                                <Route path="bookings" element={<AdminBookings />} />
                                <Route path="clients" element={<AdminClients />} />
                                <Route path="galleries" element={<AdminGalleries />} />
                                <Route path="documents" element={<AdminDocuments />} />
                                <Route path="invoices" element={<AdminInvoices />} />
                                <Route path="portfolio" element={<AdminPortfolio />} />
                                <Route path="services" element={<AdminServices />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                    <LumaChat />
                    <LightsOutViewer />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
