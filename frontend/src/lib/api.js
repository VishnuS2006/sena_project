import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 1000 * 60 * 15,
})

export function uploadDataset(file) {
  const formData = new FormData()
  formData.append("file", file)
  return api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export default api
