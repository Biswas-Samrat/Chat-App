import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext"; // Ensure AuthContext is correctly imported

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]); // This array will now be reordered
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const { socket, axios, authUser } = useContext(AuthContext); // Get authUser from AuthContext

    // Function to get all users for sidebar
    const getUsers = async () => {
        try {
            const { data } = await axios.get("/api/messages/users");
            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            console.error("Error fetching users for sidebar:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const { data } = await axios.get(`/api/messages/${userId}`);
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            const { data } = await axios.post(
                `/api/messages/send/${selectedUser._id}`,
                messageData
            );
            if (data.success) {
                setMessages((prevMessages) => [...prevMessages, data.newMessage]);
                // After sending, move the selected user to the top of the sidebar
                setUsers((prevUsers) => {
                    const updatedUsers = [...prevUsers];
                    const userIndex = updatedUsers.findIndex(u => u._id === selectedUser._id);
                    if (userIndex !== -1) {
                        const [userToMove] = updatedUsers.splice(userIndex, 1);
                        updatedUsers.unshift(userToMove); // Move to the beginning
                    }
                    return updatedUsers;
                });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Function to subscribe to messages (Socket.io listener)
    // This effect handles new incoming messages and updates state accordingly
    useEffect(() => {
        if (!socket || !authUser) return; // Ensure socket and authUser are available

        const handleNewMessage = (newMessage) => {
            console.log("New message received:", newMessage);

            // Always add the new message to the current chat's messages state
            setMessages((prevMessages) => {
                // Prevent duplicate messages if the same message arrives from both API and Socket (unlikely with proper BE)
                if (prevMessages.some(msg => msg._id === newMessage._id)) {
                    return prevMessages;
                }
                return [...prevMessages, newMessage];
            });

            // Update unseen messages count and move user to top of sidebar
            setUsers((prevUsers) => {
                const updatedUsers = [...prevUsers];
                // Determine which user's chat this message belongs to in the sidebar
                const chatPartnerId = newMessage.senderId === authUser._id ? newMessage.receiverId : newMessage.senderId;

                const userIndex = updatedUsers.findIndex(u => u._id === chatPartnerId);

                if (userIndex !== -1) {
                    const [userToMove] = updatedUsers.splice(userIndex, 1); // Remove from current position
                    updatedUsers.unshift(userToMove); // Add to the beginning
                } else {
                    // If the user isn't in the current list (e.g., first message from a new contact)
                    // You might need to re-fetch the entire user list or fetch just this new user's data.
                    // For now, if user not found, they just won't be moved to top.
                    // A `getUsers()` call here might cause too many re-fetches.
                    console.warn(`User with ID ${chatPartnerId} not found in current users list.`);
                }
                return updatedUsers;
            });

            // If the new message is for the currently selected chat, mark it as seen
            if (selectedUser && newMessage.senderId === selectedUser._id) {
                // Optimistically mark as seen in UI
                // We're already setting seen: true in backend's getMessages
                // but if message arrives when chat is open, we can mark it immediately.
                // No need for a separate axios.put call here if `getMessages` already marks them.
                // However, the backend's `markMessageAsSeen` path is for explicit marking.
                // If you want to ensure it's marked:
                // axios.put(`/api/messages/mark/${newMessage._id}`);
                // You can skip the axios call here if `getMessages` is guaranteed to run and mark all relevant messages.
            } else if (newMessage.receiverId === authUser._id) {
                // If the message is for the current authenticated user AND it's NOT from the currently selected user
                // Increment unseen message count for the sender
                setUnseenMessages((prevUnseenMessages) => ({
                    ...prevUnseenMessages,
                    [newMessage.senderId]: (prevUnseenMessages[newMessage.senderId] || 0) + 1,
                }));
            }
        };

        socket.on("newMessage", handleNewMessage);

        // Cleanup function: remove the event listener when component unmounts or dependencies change
        return () => {
            socket.off("newMessage", handleNewMessage);
        };
    }, [socket, selectedUser, authUser]); // Depend on socket, selectedUser, and authUser

    const value = {
        messages,
        users,
        selectedUser,
        unseenMessages,
        setMessages, // Expose setMessages
        getUsers: useCallback(getUsers, [axios]), // Memoize getUsers
        getMessages: useCallback(getMessages, [axios]), // Memoize getMessages
        sendMessage: useCallback(sendMessage, [axios, selectedUser]), // Memoize sendMessage
        setSelectedUser,
        setUnseenMessages,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};