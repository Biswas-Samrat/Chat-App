import React, { useState, useContext } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

function LoginPage() {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  // Removed isDataSubmitted state

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (event) => {
    event.preventDefault();

    // Directly call login, no need for the extra step or isDataSubmitted check here
    login(currState === "Sign up" ? "signup" : "login", { fullName, email, password, bio });
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex flex-col sm:flex-row items-center justify-evenly backdrop-blur-2xl">
      <div className="flex justify-center items-center h-full w-full sm:w-1/2 p-4">
        <img src={assets.logo_big} alt="" className="w-[min(30vw,250px)]" />
      </div>

      <div className="flex justify-center items-center h-full w-full sm:w-1/2 p-4">
        <form onSubmit={onSubmitHandler} className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg max-w-sm w-full">
          <h2 className="font-medium text-2xl flex justify-between items-center">
            {currState}
            <img src={assets.arrow_icon} alt="" className="w-5 cursor-pointer" />
          </h2>

          {/* Conditional rendering for input fields based on currState */}
          {currState === "Sign up" && ( // Always show for Sign up
            <input
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              type="text"
              className="p-2 border border-gray-500 rounded-md focus:outline-none"
              placeholder="Full Name"
              required
            />
          )}

          {/* Email and Password should always be visible for both login and signup */}
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password"
              required
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </>

          {currState === "Sign up" && ( // Always show for Sign up
            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              rows={4}
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="provide a short bio..."
              required
            ></textarea>
          )}

          <button
            type="submit"
            className="py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md cursor-pointer"
          >
            {currState === "Sign up" ? "Create Account" : "Login Now"}
          </button>

          {currState === "Sign up" && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="termsCheckbox" required className="accent-purple-500" />
              <label htmlFor="termsCheckbox" className="text-xs text-gray-400">
                Agree to the terms of use & privacy policy.
              </label>
            </div>
          )}

          {currState === "Sign up" ? (
            <p className="text-xs text-gray-400 text-center">
              Already have an account?{" "}
              <span
                onClick={() => setCurrState("Login")}
                className="text-purple-400 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Don't have an account?{" "}
              <span
                onClick={() => setCurrState("Sign up")}
                className="text-purple-400 cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;