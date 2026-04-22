import React, {useState} from "react";
import "./newemergency.css";

const NewEmergency = () => {
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        gender: "",
        bloodType: "",
        severity: "",
        condition: "",
        diabetic: false,
        hypertensive: false,
    });

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = () => {
        console.log("Form Data:", formData);
        // integrate API call here
    };

    return (
        <div className="new-emergency-container">
            {/* Top Bar */}
            <div className="topbar">
                <div className="logo">⚡ EmergencyConnect</div>
                <div className="status">🟢 Online</div>
            </div>

            {/* Breadcrumb */}
            <div className="breadcrumb">
                <span>Dashboard</span>
                <button className="new-btn">+ New Emergency</button>
            </div>

            {/* Step Indicator */}
            <div className="steps">
                <div className="step active">1</div>
                <span>Patient Details</span>
                <div className="line"></div>
                <div className="step">2</div>
                <span>Select Hospital</span>
            </div>

            {/* Form Card */}
            <div className="card">
                <h3>Patient Information</h3>
                <p className="subtitle">
                    Enter patient details and medical condition
                </p>

                <div className="form-grid">
                    <input
                        type="text"
                        name="name"
                        placeholder="Enter patient name"
                        onChange={handleChange}
                    />

                    <input
                        type="number"
                        name="age"
                        placeholder="Enter age"
                        onChange={handleChange}
                    />

                    <select name="gender" onChange={handleChange}>
                        <option value="">Select gender</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>

                    <select name="bloodType" onChange={handleChange}>
                        <option value="">Select blood type</option>
                        <option>A+</option>
                        <option>B+</option>
                        <option>O+</option>
                    </select>

                    <select name="severity" onChange={handleChange}>
                        <option value="">Select severity</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                    </select>
                </div>

                <textarea
                    name="condition"
                    placeholder="Describe the patient's condition (e.g., chest pain, breathing difficulty, trauma...)"
                    onChange={handleChange}
                ></textarea>

                <div className="health">
                    <label>
                        <input
                            type="checkbox"
                            name="diabetic"
                            onChange={handleChange}
                        />
                        Diabetic
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            name="hypertensive"
                            onChange={handleChange}
                        />
                        Hypertensive
                    </label>
                </div>

                <button className="voice-btn">
                    🎤 Add Voice Message (Optional)
                </button>

                <button className="submit-btn" onClick={handleSubmit}>
                    Continue to Hospital Selection
                </button>
            </div>
        </div>
    );
};

export default NewEmergency;