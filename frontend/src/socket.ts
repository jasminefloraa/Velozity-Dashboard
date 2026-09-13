import { io } from "socket.io-client";

const socket = io("https://velozity-dashboard-jy7r.onrender.com", {
  withCredentials: true,
});

export default socket;