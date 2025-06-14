import { corsRouter } from "convex-helpers/server/cors"
import { httpRouter } from "convex/server"
import { generateUploadUrl, uploadComplete } from "./attachments"
import { chatGET } from "./chat_http/get.route"
import { chatPOST } from "./chat_http/post.route"

const http = httpRouter()
const cors = corsRouter(http, {
    allowedOrigins: ["http://localhost:3000", "https://intern3.vercel.app", "https://intern3.chat"],
    allowedHeaders: ["Content-Type", "Authorization"],
    allowCredentials: true
})

cors.route({
    path: "/chat",
    method: "POST",
    handler: chatPOST
})

cors.route({
    path: "/chat",
    method: "GET",
    handler: chatGET
})

// Attachment upload routes
cors.route({
    path: "/attachments/upload-url",
    method: "GET",
    handler: generateUploadUrl
})

cors.route({
    path: "/attachments/upload-complete",
    method: "POST",
    handler: uploadComplete
})

export default http
