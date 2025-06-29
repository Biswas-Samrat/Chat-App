import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

function Sidebar() {
    const {
        getUsers,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getMessages,
        setMessages,
    } = useContext(ChatContext);

    const { logout, onlineUsers, authUser } = useContext(AuthContext);

    const [input, setInput] = useState("");
    const navigate = useNavigate();

    const filteredUsers = input
        ? users.filter((user) =>
              user.fullName.toLowerCase().includes(input.toLowerCase())
          )
        : users;

    const memoizedGetUsers = useCallback(getUsers, []);

    useEffect(() => {
        memoizedGetUsers();
    }, [memoizedGetUsers]);

    return (
        <div
            className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${selectedUser ? "max-md:hidden" : ""}`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
            <style>{`::-webkit-scrollbar { display: none; }`}</style>

            <div className="pb-5">
                <div className="flex justify-between items-center">
                    <img src={assets.logo} alt="Logo" className="max-w-40" />
                    <div className="relative py-2 group">
                        <img src={assets.menu_icon} alt="Menu" className="max-h-5 cursor-pointer" />
                        <div className="absolute top-full right-0 z-20 w-32 p-1 rounded-md bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block">
                            <p onClick={() => navigate("/profile")} className="cursor-pointer text-sm py-1 px-2 hover:bg-gray-700 rounded">Edit Profile</p>
                            <hr className="my-2 border-t border-gray-500" />
                            <p onClick={logout} className="cursor-pointer text-sm py-1 px-2 hover:bg-gray-700 rounded">Logout</p>
                        </div>
                    </div>
                </div>

                <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
                    <img src={assets.search_icon} alt="Search Icon" className="w-3" />
                    <input
                        onChange={(e) => setInput(e.target.value)}
                        type="text"
                        className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
                        placeholder="Search User..."
                        value={input}
                    />
                </div>
            </div>

            <div className="flex flex-col">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                        if (authUser && user._id === authUser._id) return null;

                        const isOnline = onlineUsers.includes(user._id);
                        const userUnseenMessages = unseenMessages[user._id] || 0;

                        return (
                            <div
                                onClick={() => {
                                    setMessages([]);
                                    setSelectedUser(user);
                                    getMessages(user._id);
                                    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                                }}
                                key={user._id}
                                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer transition-colors duration-200 max-sm:text-sm ${
                                    selectedUser?._id === user._id
                                        ? "bg-[#282142]/70"
                                        : "hover:bg-[#282142]/40"
                                }`}
                            >
                                <img src={user?.profilePic || assets.avatar_icon} alt="Profile" className="w-[35px] h-[35px] object-cover rounded-full flex-shrink-0" />
                                <div className="flex flex-col leading-tight flex-grow min-w-0">
                                    <p className="truncate">{user.fullName}</p>
                                    <span className={`text-xs ${isOnline ? "text-green-400" : "text-neutral-400"}`}>{isOnline ? "Online" : "Offline"}</span>
                                </div>

                                {userUnseenMessages > 0 && (
                                    <p className="absolute top-1/2 -translate-y-1/2 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50">
                                        {userUnseenMessages}
                                    </p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-neutral-400 text-center mt-4">
                        {input ? "No users found." : "Loading users..."}
                    </p>
                )}
            </div>
        </div>
    );
}

export default Sidebar;
