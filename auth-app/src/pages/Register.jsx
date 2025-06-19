import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/Register.css";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:3001/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        navigate("/setup-mfa", {
          state: { userId: data.userId, email },
        });
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className="register_wrapper">
      <button className="back-top" onClick={() => navigate("/")}>
        ← Back
      </button>
      <div className="step-indicator">Step 1 of 3</div>
      <h2>Create your account</h2>

      <form onSubmit={handleSignUp}>
        <label>Email address</label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <div className="password-wrapper">
          <input
            type="password"
            required
            minLength={8}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button className="button" type="submit">
          Sign Up
        </button>
      </form>

      <div className="info-link">
        Already have an account? <a href="/login">Log in</a>
      </div>
    </div>
  );
}

export default Register;
