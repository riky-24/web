import axios from "axios";

// Membuat instance axios agar tidak perlu ulang-ulang nulis URL
const api = axios.create({
  baseURL: "http://localhost:5000/api", // URL Backend kita
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor (Opsional: Untuk debugging jika ada error dari backend)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API Error:",
      error.response ? error.response.data : error.message
    );
    return Promise.reject(error);
  }
);

export default api;
