/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chat_http from "../chat_http.js";
import type * as http from "../http.js";
import type * as lib_backend_to_ui_messages from "../lib/backend_to_ui_messages.js";
import type * as lib_db_to_core_messages from "../lib/db_to_core_messages.js";
import type * as lib_env from "../lib/env.js";
import type * as lib_identity from "../lib/identity.js";
import type * as messages from "../messages.js";
import type * as schema_message from "../schema/message.js";
import type * as schema_parts from "../schema/parts.js";
import type * as schema_streams from "../schema/streams.js";
import type * as schema_thread from "../schema/thread.js";
import type * as streams from "../streams.js";
import type * as threads from "../threads.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chat_http: typeof chat_http;
  http: typeof http;
  "lib/backend_to_ui_messages": typeof lib_backend_to_ui_messages;
  "lib/db_to_core_messages": typeof lib_db_to_core_messages;
  "lib/env": typeof lib_env;
  "lib/identity": typeof lib_identity;
  messages: typeof messages;
  "schema/message": typeof schema_message;
  "schema/parts": typeof schema_parts;
  "schema/streams": typeof schema_streams;
  "schema/thread": typeof schema_thread;
  streams: typeof streams;
  threads: typeof threads;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
