import React, { useRef, useEffect, useContext, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Dialog } from "@mui/material";

function ChatContainer() {
    const { messages, selectedUser, setSelectedUser, sendMessage } = useContext(ChatContext);
    const { authUser, onlineUsers, axios } = useContext(AuthContext);

    const scrollEnd = useRef();
    const [input, setInput] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [openImage, setOpenImage] = useState(null);

    useEffect(() => {
        if (scrollEnd.current) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (selectedUser && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== authUser._id && !lastMessage.seen) {
                axios.put(`/api/messages/mark/${lastMessage._id}`);
            }
        }
    }, [messages, selectedUser]);

    const handleSendMessage = async () => {
        if (!selectedUser) return toast.error("Please select a user to send a message.");
        let messageData = {};

        if (imageFile) {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                messageData.image = reader.result;
                if (input.trim()) messageData.text = input.trim();
                await sendMessage(messageData);
                setInput('');
                setImageFile(null);
                setImagePreview(null);
            };
        } else if (input.trim()) {
            messageData.text = input.trim();
            await sendMessage(messageData);
            setInput('');
        } else {
            toast("Cannot send an empty message.", { icon: 'ℹ️' });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size <= 4 * 1024 * 1024) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            toast.success("Image selected!");
        } else {
            toast.error("Image exceeds 4MB.");
            setImageFile(null);
            setImagePreview(null);
        }
    };

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const downloadImage = async (url) => {
        try {
            const response = await fetch(url, { mode: 'cors' });
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `image-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            toast.error("Failed to download image.");
        }
    };

    if (!selectedUser) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
                <img src={assets.logo_icon} className="mx-w-16" style={{ height: "20%" }} alt="Logo" />
                <p className="text-lg font-medium text-white">Chat Any Time</p>
                <p className="text-sm">Select a user to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative backdrop-blur-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 py-3 border-b border-stone-500 sticky top-0 z-10 bg-[#1c1b29]"
            style={{width:"100%"}}>
                <img src={selectedUser?.profilePic || assets.avatar_icon} className="w-8 h-8 rounded-full object-cover"
                style={{marginLeft:"2rem"}}
                />
                <p className="flex-1 text-lg text-white flex items-center gap-2"
                style={{marginTop:"10px"}}
                >
                    {selectedUser?.fullName}
                    <span className={`w-2 h-2 rounded-full ${onlineUsers.includes(selectedUser?._id) ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                </p>
                <img onClick={() => { setSelectedUser(null); setImageFile(null); setImagePreview(null); }} src={assets.arrow_icon} alt="Back" className="md:hidden max-w-7 cursor-pointer" />
              
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-3 pb-6" style={{ maxHeight: "calc(100vh - 180px)" }}>
                {messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isSender = msg.senderId === authUser?._id;
                        return (
                            <div key={msg._id || index} className={`flex mb-4 ${isSender ? "justify-end" : "justify-start"}`}>
                                <div className={`flex items-start gap-2 max-w-[70%] ${isSender ? "flex-row-reverse" : ""}`}>
                                    <img
                                        src={(isSender ? authUser : selectedUser)?.profilePic || assets.avatar_icon}
                                        alt="Avatar"
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <div>
                                        <div className={`rounded-lg p-2 text-sm text-white break-all 
                                            ${isSender ? "bg-violet-500/30 rounded-br-none" : "bg-gray-600/30 rounded-bl-none"}`}>
                                            {msg.image && (
                                                <div className="relative group">
                                                    <img
                                                        src={msg.image}
                                                        alt="Message"
                                                        className="max-w-[230px] rounded-md cursor-pointer"
                                                        onClick={() => setOpenImage(msg.image)}
                                                    />
                                                    <button
                                                        onClick={() => downloadImage(msg.image)}
                                                        className="absolute bottom-1 right-1 bg-black/50 text-white px-1 text-xs rounded hidden group-hover:block"
                                                    >
                                                        Download
                                                    </button>
                                                </div>
                                            )}
                                            {msg.text && <p className={`${msg.image ? "mt-2" : ""}`}>{msg.text}</p>}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 flex gap-2">
                                            <span>{formatMessageTime(msg.createdAt)}</span>
                                            {isSender && (
                                                <span className={msg.seen ? 'text-green-400' : 'text-gray-400'}>
                                                    {msg.seen ? 'Seen' : 'Delivered'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500 text-center mt-auto mb-auto">Start a conversation!</p>
                )}
                <div ref={scrollEnd} className="mt-5"></div>
            </div>

            {/* Input */}
            <div className="flex items-center gap-3 p-3 mt-auto bg-[#1c1b29]">
                <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
                    {imagePreview && (
                        <div className="relative mr-2">
                            <img src={imagePreview} className="w-10 h-10 object-cover rounded-md" />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">x</button>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder={imageFile ? "Add a caption..." : "Send a message"}
                        className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (input.trim() || imageFile)) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <input type="file" id="image" accept="image/*" hidden onChange={handleImageChange} onClick={(e) => e.target.value = null} />
                    <label htmlFor="image">
                        <img src={assets.gallery_icon} alt="Attach" className="w-5 mr-2 cursor-pointer" />
                    </label>
                </div>
                <img src={assets.send_button} alt="Send" className="w-7 cursor-pointer" onClick={handleSendMessage} />
            </div>

            {/* Image Dialog */}
            <Dialog open={!!openImage} onClose={() => setOpenImage(null)} maxWidth="md">
                <img src={openImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain" />
            </Dialog>
        </div>
    );
}

export default ChatContainer;
