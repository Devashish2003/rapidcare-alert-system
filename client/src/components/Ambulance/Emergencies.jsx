import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../contexts/AuthContext";
import apiService from "../../services/api";
import AmbulanceHeader from "./AmbulanceHeader";
import "./ambulance.css";

const SEVERITY_ORDER = {critical: 0, high: 1, medium: 2, low: 3};

const Emergencies = () => {
    const {user: authUser} = useAuth();
    const [emergencies, setEmergencies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        fetchEmergencies();
    }, []);

    const fetchEmergencies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getEmergencies();
            setEmergencies(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError("Failed to load emergencies");
            console.error("Error fetching emergencies:", err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = emergencies
        .filter((e) => {
            if (filter === "active") return ["pending", "en_route", "at_hospital"].includes(e.status);
            if (filter === "completed") return ["completed", "cancelled"].includes(e.status);
            return true;
        })
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

    const statusLabel = (status) =>
        ({
            pending: "Pending",
            en_route: "En Route",
            at_hospital: "At Hospital",
            completed: "Completed",
            cancelled: "Cancelled"
        }[status] || status);

    const statusPillClass = (status) =>
        ({
            pending: "status-pill",
            en_route: "status-pill enroute",
            at_hospital: "status-pill enroute",
            completed: "status-pill completed",
            cancelled: "status-pill completed"
        }[status] || "status-pill");

    return (
        <div className="dashboard-container">
            <AmbulanceHeader activePath="/emergencies"/>
            {/* PAGE HEADER */}
            <div className="page-header">
                <div>
                    <h2>Emergencies</h2>
                    <p>All emergency cases assigned to you</p>
                </div>
                <button className="primary-btn" onClick={() => navigate("/new-emergency")}>+ New Emergency
                </button>
            </div>

            {/* FILTER TABS */}
            <div style={{margin: "0 30px 20px", display: "flex", gap: "8px"}}>
                {["all", "active", "completed"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "7px 18px",
                            borderRadius: "6px",
                            border: "1px solid #e5e7eb",
                            background: filter === f ? "#dc2626" : "white",
                            color: filter === f ? "white" : "#6b7280",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: filter === f ? "600" : "400",
                            textTransform: "capitalize",
                        }}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            {loading && <div style={{padding: "1rem 30px", color: "#6b7280"}}>Loading emergencies...</div>}
            {error && !loading && (
                <div style={{
                    margin: "0 30px",
                    padding: "1rem",
                    color: "#dc2626",
                    background: "#fef2f2",
                    borderRadius: "8px"
                }}>
                    {error} —{" "}
                    <button onClick={fetchEmergencies} style={{
                        color: "#dc2626",
                        textDecoration: "underline",
                        background: "none",
                        border: "none",
                        cursor: "pointer"
                    }}>
                        Retry
                    </button>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="card"
                     style={{margin: "0 30px", textAlign: "center", padding: "40px", color: "#6b7280"}}>
                    No {filter !== "all" ? filter : ""} emergencies found.
                </div>
            )}

            {!loading && !error && filtered.length > 0 && (
                <div className="card" style={{margin: "0 30px 25px"}}>
                    {filtered.map((emergency, idx) => (
                        <div
                            key={emergency.id}
                            className="emergency-item"
                            style={{
                                borderTop: idx > 0 ? "1px solid #f3f4f6" : "none",
                                marginTop: idx > 0 ? "0" : undefined
                            }}
                        >
                            <div style={{flex: 1}}>
                                <h5 style={{margin: "0 0 4px", fontSize: "15px", color: "#111827"}}>
                                    {emergency.patient_name || "Unknown Patient"}
                                    <span className={`badge ${emergency.severity}`}>{emergency.severity}</span>
                                </h5>
                                <p style={{margin: "0 0 4px", fontSize: "13px", color: "#374151"}}>
                                    {emergency.condition_description || emergency.case_description || "No description"}
                                </p>
                                <span className="meta">
                                    {emergency.assigned_hospital?.name || "No hospital assigned"}
                                    {emergency.eta_to_hospital ? ` • ETA: ${emergency.eta_to_hospital}` : ""}
                                    {emergency.created_at ? ` • ${new Date(emergency.created_at).toLocaleString()}` : ""}
                                </span>
                            </div>
                            <span className={statusPillClass(emergency.status)}>{statusLabel(emergency.status)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Emergencies;
