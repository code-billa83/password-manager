import React, { useState, useEffect } from 'react';
import './Manager.css';
import { FaCopy, FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import { LuEye, LuEyeOff } from 'react-icons/lu';

const Manager = () => {
    // States for input form fields
    const [form, setForm] = useState({ site: "", username: "", password: "" });

    // State for storing the list of all passwords
    const [passwordArray, setPasswordArray] = useState([]);

    // State to toggle main input field password visibility
    const [showInputPassword, setShowInputPassword] = useState(false);

    // Object state to manage password visibility for individual table rows
    const [visiblePasswords, setVisiblePasswords] = useState({});

    // URL configuration for secure Express Backend API
    const BACKEND_URL = "https://password-manager-qhfx.onrender.com";

    // Security layer: Implementing anti-inspect tools and synchronization on load
    useEffect(() => {
        // 1. Disable right-click context menu across the component
        const handleContextMenu = (e) => e.preventDefault();
        document.addEventListener("contextmenu", handleContextMenu);

        // 2. Intercept and block developer shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
        const handleKeyDown = (e) => {
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && e.key === "I") ||
                (e.ctrlKey && e.shiftKey && e.key === "J") ||
                (e.ctrlKey && e.key === "u") ||
                (e.ctrlKey && e.key === "U")
            ) {
                e.preventDefault();
                alert("Security Alert: Developer inspection tools are disabled on this application!");
            }
        };
        document.addEventListener("keydown", handleKeyDown);

        // 3. Sync data initially from local storage for fast response
        const localData = localStorage.getItem('passwords');
        if (localData) {
            setPasswordArray(JSON.parse(localData));
        }

        // 4. Fetch the latest secure data directly from MongoDB database
        const getPasswords = async () => {
            try {
                let req = await fetch(`${BACKEND_URL}/`);
                if (req.ok) {
                    let passwords = await req.json();
                    setPasswordArray(passwords);
                    localStorage.setItem('passwords', JSON.stringify(passwords));
                }
            } catch (error) {
                console.log("Backend offline, working securely with local storage fallback.");
            }
        };
        getPasswords();

        // Cleanup events when the component unmounts
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    // Update input states dynamically on user input change
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Secure handler to save a new password entry or submit modified data
    const savePassword = async () => {
        if (form.site.length > 3 && form.username.length > 3 && form.password.length > 3) {
            let updatedArray;
            const newPasswordItem = { ...form };

            if (form.id) {
                // Validation check before allowing modifications to pre-existing data
                const originalItem = passwordArray.find(item => item.id === form.id);
                const confirmPass = prompt("Security Validation: Enter the CURRENT password of this account to update changes:");

                if (confirmPass !== originalItem.password) {
                    alert("Access Denied: Incorrect password. Modification aborted!");
                    return;
                }

                updatedArray = passwordArray.map(item => item.id === form.id ? form : item);

                try {
                    await fetch(`${BACKEND_URL}/`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(form)
                    });
                } catch (error) {
                    console.error("Failed to sync structural updates with backend:", error);
                }
            } else {
                // Set a unique identifier key for new database entries
                newPasswordItem.id = crypto.randomUUID();
                updatedArray = [...passwordArray, newPasswordItem];

                try {
                    await fetch(`${BACKEND_URL}/`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(newPasswordItem)
                    });
                } catch (error) {
                    console.error("Failed to commit new record entry to backend database:", error);
                }
            }

            setPasswordArray(updatedArray);
            localStorage.setItem('passwords', JSON.stringify(updatedArray));
            setForm({ site: "", username: "", password: "" });
            alert("Success: Credentials updated successfully!");
        } else {
            alert("Validation Error: All fields require a minimum of 4 characters!");
        }
    };

    // Secure handler to request entry deletion from database
    const deletePassword = async (id) => {
        const originalItem = passwordArray.find(item => item.id === id);
        const confirmPass = prompt("Security Validation: Enter the exact password of this account to authorize permanent deletion:");

        if (confirmPass !== originalItem.password) {
            alert("Access Denied: Incorrect password authorization failed!");
            return;
        }

        const updatedArray = passwordArray.filter(item => item.id !== id);
        setPasswordArray(updatedArray);
        localStorage.setItem('passwords', JSON.stringify(updatedArray));

        try {
            await fetch(`${BACKEND_URL}/`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            alert("Success: Record permanent deletion completed!");
        } catch (error) {
            console.error("Failed to execute deletion pipeline on server side:", error);
        }
    };

    // Populate data inputs back into fields safely for edit operations
    const editPassword = (item) => {
        const confirmPass = prompt("Security Validation: Enter the current password to unlock configurations for editing:");
        if (confirmPass === item.password) {
            setForm(item);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert("Access Denied: Invalid credentials provided!");
        }
    };

    // Direct asynchronous text copier function
    const copyText = (text) => {
        navigator.clipboard.writeText(text);
        alert("System Notification: Copied to clipboard successfully!");
    };

    // Individual record protection view visibility toggler
    const toggleTablePasswordVisibility = (id) => {
        const originalItem = passwordArray.find(item => item.id === id);

        if (!visiblePasswords[id]) {
            const confirmPass = prompt("Security Validation: Enter the account password to reveal masked plain text:");
            if (confirmPass !== originalItem.password) {
                alert("Access Denied: Authentication failed!");
                return;
            }
        }
        setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };
    return (
        <div className="manager-container">
            {/* Branding Segment */}
            <div className="heading-section">
                <h1>&lt;<span className="green-text">Pass</span>OP/&gt;</h1>
                <p>Your own Password Manager</p>
            </div>

            {/* Input Control Interface */}
            <div className="form-container">
                <input
                    type="text"
                    name="site"
                    value={form.site}
                    onChange={handleChange}
                    placeholder="Enter website URL"
                    className="input-field full-width"
                />

                <div className="row-fields">
                    <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Enter Username"
                        className="input-field flex-grow"
                    />
                    <div className="password-wrapper">
                        <input
                            type={showInputPassword ? "text" : "password"}
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter Password"
                            className="input-field password-input"
                        />
                        <span className="eye-icon" onClick={() => setShowInputPassword(!showInputPassword)}>
                            {showInputPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                        </span>
                    </div>
                </div>

                <button className="save-btn" onClick={savePassword}>
                    <FaPlus size={14} /> {form.id ? "Update Password" : "Save"}
                </button>
            </div>

            {/* Detailed Datatable Section */}
            <div className="table-section">
                <h2>Your Passwords</h2>

                <div className="table-responsive">
                    <table className="password-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Site</th>
                                <th style={{ width: '22%' }}>Username</th>
                                <th style={{ width: '25%' }}>Password</th>
                                <th style={{ width: '13%', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passwordArray.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                        No Passwords Saved Yet.
                                    </td>
                                </tr>
                            ) : (
                                passwordArray.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="td-content">
                                                <span className="truncate-text">{item.site}</span>
                                                <button className="icon-action-btn copy-btn" onClick={() => copyText(item.site)}><FaCopy size={13} /></button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="td-content">
                                                <span>{item.username}</span>
                                                <button className="icon-action-btn copy-btn" onClick={() => copyText(item.username)}><FaCopy size={13} /></button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="td-content password-td-content">
                                                <span>{visiblePasswords[item.id] ? item.password : "••••••••"}</span>
                                                <div className="password-actions-inside">
                                                    <button className="icon-action-btn eye-table-btn" onClick={() => toggleTablePasswordVisibility(item.id)}>
                                                        {visiblePasswords[item.id] ? <LuEyeOff size={14} /> : <LuEye size={14} />}
                                                    </button>
                                                    <button className="icon-action-btn copy-btn" onClick={() => copyText(item.password)}><FaCopy size={13} /></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button className="icon-action-btn edit-btn" onClick={() => editPassword(item)}><FaEdit size={16} /></button>
                                                <button className="icon-action-btn delete-btn" onClick={() => deletePassword(item.id)}><FaTrashAlt size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Manager;
