/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js"
import type * as apikeys from "../apikeys.js"
import type * as attachments from "../attachments.js"
import type * as chat_http_generate_thread_name from "../chat_http/generate_thread_name.js"
import type * as chat_http_manual_stream_transform from "../chat_http/manual_stream_transform.js"
import type * as chat_http_prompt from "../chat_http/prompt.js"
import type * as chat_http_shared from "../chat_http/shared.js"
import type * as http from "../http.js"
import type * as lib_backend_to_ui_messages from "../lib/backend_to_ui_messages.js"
import type * as lib_db_to_core_messages from "../lib/db_to_core_messages.js"
import type * as lib_encryption from "../lib/encryption.js"
import type * as lib_identity from "../lib/identity.js"
import type * as lib_models from "../lib/models.js"
import type * as lib_resumable_stream_context from "../lib/resumable_stream_context.js"
import type * as lib_toolkit from "../lib/toolkit.js"
import type * as lib_tools_adapters_brave_search_adapter from "../lib/tools/adapters/brave_search_adapter.js"
import type * as lib_tools_adapters_firecrawl_search_adapter from "../lib/tools/adapters/firecrawl_search_adapter.js"
import type * as lib_tools_adapters_index from "../lib/tools/adapters/index.js"
import type * as lib_tools_adapters_search_adapter from "../lib/tools/adapters/search_adapter.js"
import type * as lib_tools_adapters_search_provider from "../lib/tools/adapters/search_provider.js"
import type * as lib_tools_web_search from "../lib/tools/web_search.js"
import type * as messages from "../messages.js"
import type * as schema_apikey from "../schema/apikey.js"
import type * as schema_message from "../schema/message.js"
import type * as schema_parts from "../schema/parts.js"
import type * as schema_streams from "../schema/streams.js"
import type * as schema_thread from "../schema/thread.js"
import type * as schema_usage from "../schema/usage.js"
import type * as streams from "../streams.js"
import type * as threads from "../threads.js"

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server"

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
    analytics: typeof analytics
    apikeys: typeof apikeys
    attachments: typeof attachments
    "chat_http/generate_thread_name": typeof chat_http_generate_thread_name
    "chat_http/manual_stream_transform": typeof chat_http_manual_stream_transform
    "chat_http/prompt": typeof chat_http_prompt
    "chat_http/shared": typeof chat_http_shared
    http: typeof http
    "lib/backend_to_ui_messages": typeof lib_backend_to_ui_messages
    "lib/db_to_core_messages": typeof lib_db_to_core_messages
    "lib/encryption": typeof lib_encryption
    "lib/identity": typeof lib_identity
    "lib/models": typeof lib_models
    "lib/resumable_stream_context": typeof lib_resumable_stream_context
    "lib/toolkit": typeof lib_toolkit
    "lib/tools/adapters/brave_search_adapter": typeof lib_tools_adapters_brave_search_adapter
    "lib/tools/adapters/firecrawl_search_adapter": typeof lib_tools_adapters_firecrawl_search_adapter
    "lib/tools/adapters/index": typeof lib_tools_adapters_index
    "lib/tools/adapters/search_adapter": typeof lib_tools_adapters_search_adapter
    "lib/tools/adapters/search_provider": typeof lib_tools_adapters_search_provider
    "lib/tools/web_search": typeof lib_tools_web_search
    messages: typeof messages
    "schema/apikey": typeof schema_apikey
    "schema/message": typeof schema_message
    "schema/parts": typeof schema_parts
    "schema/streams": typeof schema_streams
    "schema/thread": typeof schema_thread
    "schema/usage": typeof schema_usage
    streams: typeof streams
    threads: typeof threads
}>
declare const fullApiWithMounts: typeof fullApi

export declare const api: FilterApi<typeof fullApiWithMounts, FunctionReference<any, "public">>
export declare const internal: FilterApi<
    typeof fullApiWithMounts,
    FunctionReference<any, "internal">
>

export declare const components: {
    r2: {
        lib: {
            deleteMetadata: FunctionReference<
                "mutation",
                "internal",
                { bucket: string; key: string },
                null
            >
            deleteObject: FunctionReference<
                "mutation",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    endpoint: string
                    forcePathStyle: boolean
                    key: string
                    secretAccessKey: string
                },
                null
            >
            deleteR2Object: FunctionReference<
                "action",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    endpoint: string
                    forcePathStyle: boolean
                    key: string
                    secretAccessKey: string
                },
                null
            >
            getMetadata: FunctionReference<
                "query",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    endpoint: string
                    forcePathStyle: boolean
                    key: string
                    secretAccessKey: string
                },
                {
                    bucket: string
                    bucketLink: string
                    contentType?: string
                    key: string
                    lastModified: string
                    link: string
                    sha256?: string
                    size?: number
                    url: string
                } | null
            >
            listMetadata: FunctionReference<
                "query",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    cursor?: string
                    endpoint: string
                    forcePathStyle: boolean
                    limit?: number
                    secretAccessKey: string
                },
                {
                    continueCursor: string
                    isDone: boolean
                    page: Array<{
                        bucket: string
                        bucketLink: string
                        contentType?: string
                        key: string
                        lastModified: string
                        link: string
                        sha256?: string
                        size?: number
                        url: string
                    }>
                    pageStatus?: null | "SplitRecommended" | "SplitRequired"
                    splitCursor?: null | string
                }
            >
            store: FunctionReference<
                "action",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    endpoint: string
                    forcePathStyle: boolean
                    secretAccessKey: string
                    url: string
                },
                any
            >
            syncMetadata: FunctionReference<
                "action",
                "internal",
                {
                    accessKeyId: string
                    bucket: string
                    endpoint: string
                    forcePathStyle: boolean
                    key: string
                    onComplete?: string
                    secretAccessKey: string
                },
                null
            >
            upsertMetadata: FunctionReference<
                "mutation",
                "internal",
                {
                    bucket: string
                    contentType?: string
                    key: string
                    lastModified: string
                    link: string
                    sha256?: string
                    size?: number
                },
                { isNew: boolean }
            >
        }
    }
}
