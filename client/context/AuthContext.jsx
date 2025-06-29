import { createContext, useState ,useEffect} from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client"

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Function to set the Authorization header for Axios
  const setAuthHeader = (newToken) => {
    if (newToken) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      console.log("Axios Authorization header set to:", axios.defaults.headers.common["Authorization"]); // Debug
    } else {
      delete axios.defaults.headers.common["Authorization"];
      console.log("Axios Authorization header cleared."); // Debug
    }
  };

  // Check if user is authenticated and if so, set the user data and connect to socket
  const checkAuth = async () => {
    // Only attempt to checkAuth if a token exists in state
    if (!token) {
        setAuthUser(null);
        setOnlineUsers([]);
        // console.log("No token in state for checkAuth. Skipping.");
        return;
    }
    try {
      // The Authorization header should already be set by the useEffect
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user)
      } else {
          // If backend reports not successful, even with a token, it might be invalid
          console.warn("Auth check returned success: false. Token likely invalid or expired.");
          logout(); // Force logout
      }
    } catch (error) {
      console.error("Auth check failed:", error); // Use console.error for errors
      toast.error("Authentication failed. Please log in again.");
      logout(); // Force logout on error
    }
  };

// Login function to handle user authentication and socket connection
const login = async (state, credentials)=>{
    try {
        const { data } = await axios.post(`/api/auth/${state}`, credentials);
        if (data.success){
            setAuthUser(data.userData);
            connectSocket(data.userData);
            
            setToken(data.token); // Update state first, which triggers useEffect
            localStorage.setItem("token", data.token);
            toast.success(data.message)
        }else{
            toast.error(data.message)
        }
    } catch (error) {
        console.error("Login failed:", error); // Debugging
        toast.error(error.response?.data?.message || error.message); // Better error message
    }
}


// Logout function to handle user logout and socket disconnection
const logout = async () =>{
    localStorage.removeItem("token");
    setToken(null); // This will trigger the useEffect to clear the header
    setAuthUser(null);
    setOnlineUsers([]);
    toast.success("Logged out successfully");
    socket?.disconnect();
    setSocket(null); // Clear socket state
}


// Update profile function to handle user profile updates
const updateProfile = async (body)=>{
    try {
        const { data } = await axios.put("/api/auth/update-profile", body);
        if(data.success){
            setAuthUser(data.user);
            toast.success("Profile updated successfully")
        } else {
            toast.error(data.message);
        }
    } catch (error) {
       console.error("Profile update failed:", error); // Debugging
        toast.error(error.response?.data?.message || error.message);
    }
}


// Connect socket function to handle socket connection and online users update
const connectSocket = (userData)=>{
    if(!userData || socket?.connected) return;
    const newSocket = io(backendUrl, {
        query: {
            userId: userData._id,
        },
        extraHeaders: {
            Authorization: `Bearer ${localStorage.getItem("token")}` // Ensure token is present
        }
    });
    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds)=>{
        setOnlineUsers(userIds);
    });

    newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        // Consider what to do here: maybe try to reconnect, or notify user
    });
    newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
        // Handle connection errors (e.g., if backend is down or CORS issues)
    });
}


  useEffect(()=>{
    // This effect runs on initial mount and whenever 'token' state changes
    setAuthHeader(token); // Set the Authorization header based on current token state
    checkAuth(); // Then attempt to check authentication
}, [token]); // Depend on 'token' to ensure header is updated when token state changes

  const value = {
    axios, // Still advising caution here, but for debugging, it's fine.
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};