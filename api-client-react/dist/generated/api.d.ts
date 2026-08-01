import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ChatRequest, Conversation, ConversationInput, ConversationUpdate, ConversationWithMessages, HealthStatus, ListConversationsParams, Message, MessageReaction, ModeStat } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListConversationsUrl: (params?: ListConversationsParams) => string;
/**
 * @summary List all conversations
 */
export declare const listConversations: (params?: ListConversationsParams, options?: RequestInit) => Promise<Conversation[]>;
export declare const getListConversationsQueryKey: (params?: ListConversationsParams) => readonly ["/api/conversations", ...ListConversationsParams[]];
export declare const getListConversationsQueryOptions: <TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(params?: ListConversationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListConversationsQueryResult = NonNullable<Awaited<ReturnType<typeof listConversations>>>;
export type ListConversationsQueryError = ErrorType<unknown>;
/**
 * @summary List all conversations
 */
export declare function useListConversations<TData = Awaited<ReturnType<typeof listConversations>>, TError = ErrorType<unknown>>(params?: ListConversationsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listConversations>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateConversationUrl: () => string;
/**
 * @summary Create a new conversation
 */
export declare const createConversation: (conversationInput: ConversationInput, options?: RequestInit) => Promise<Conversation>;
export declare const getCreateConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export type CreateConversationMutationResult = NonNullable<Awaited<ReturnType<typeof createConversation>>>;
export type CreateConversationMutationBody = BodyType<ConversationInput>;
export type CreateConversationMutationError = ErrorType<unknown>;
/**
* @summary Create a new conversation
*/
export declare const useCreateConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createConversation>>, TError, {
        data: BodyType<ConversationInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createConversation>>, TError, {
    data: BodyType<ConversationInput>;
}, TContext>;
export declare const getGetConversationUrl: (id: number) => string;
/**
 * @summary Get a conversation with messages
 */
export declare const getConversation: (id: number, options?: RequestInit) => Promise<ConversationWithMessages>;
export declare const getGetConversationQueryKey: (id: number) => readonly [`/api/conversations/${number}`];
export declare const getGetConversationQueryOptions: <TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetConversationQueryResult = NonNullable<Awaited<ReturnType<typeof getConversation>>>;
export type GetConversationQueryError = ErrorType<void>;
/**
 * @summary Get a conversation with messages
 */
export declare function useGetConversation<TData = Awaited<ReturnType<typeof getConversation>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getConversation>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateConversationUrl: (id: number) => string;
/**
 * @summary Update a conversation title
 */
export declare const updateConversation: (id: number, conversationUpdate: ConversationUpdate, options?: RequestInit) => Promise<Conversation>;
export declare const getUpdateConversationMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateConversation>>, TError, {
        id: number;
        data: BodyType<ConversationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateConversation>>, TError, {
    id: number;
    data: BodyType<ConversationUpdate>;
}, TContext>;
export type UpdateConversationMutationResult = NonNullable<Awaited<ReturnType<typeof updateConversation>>>;
export type UpdateConversationMutationBody = BodyType<ConversationUpdate>;
export type UpdateConversationMutationError = ErrorType<void>;
/**
* @summary Update a conversation title
*/
export declare const useUpdateConversation: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateConversation>>, TError, {
        id: number;
        data: BodyType<ConversationUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateConversation>>, TError, {
    id: number;
    data: BodyType<ConversationUpdate>;
}, TContext>;
export declare const getDeleteConversationUrl: (id: number) => string;
/**
 * @summary Delete a conversation
 */
export declare const deleteConversation: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteConversationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export type DeleteConversationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteConversation>>>;
export type DeleteConversationMutationError = ErrorType<unknown>;
/**
* @summary Delete a conversation
*/
export declare const useDeleteConversation: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteConversation>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteConversation>>, TError, {
    id: number;
}, TContext>;
export declare const getListMessagesUrl: (id: number) => string;
/**
 * @summary List messages for a conversation
 */
export declare const listMessages: (id: number, options?: RequestInit) => Promise<Message[]>;
export declare const getListMessagesQueryKey: (id: number) => readonly [`/api/conversations/${number}/messages`];
export declare const getListMessagesQueryOptions: <TData = Awaited<ReturnType<typeof listMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListMessagesQueryResult = NonNullable<Awaited<ReturnType<typeof listMessages>>>;
export type ListMessagesQueryError = ErrorType<unknown>;
/**
 * @summary List messages for a conversation
 */
export declare function useListMessages<TData = Awaited<ReturnType<typeof listMessages>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listMessages>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getChatStreamUrl: () => string;
/**
 * @summary Stream a chat message (SSE)
 */
export declare const chatStream: (chatRequest: ChatRequest, options?: RequestInit) => Promise<string>;
export declare const getChatStreamMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof chatStream>>, TError, {
        data: BodyType<ChatRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof chatStream>>, TError, {
    data: BodyType<ChatRequest>;
}, TContext>;
export type ChatStreamMutationResult = NonNullable<Awaited<ReturnType<typeof chatStream>>>;
export type ChatStreamMutationBody = BodyType<ChatRequest>;
export type ChatStreamMutationError = ErrorType<unknown>;
/**
* @summary Stream a chat message (SSE)
*/
export declare const useChatStream: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof chatStream>>, TError, {
        data: BodyType<ChatRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof chatStream>>, TError, {
    data: BodyType<ChatRequest>;
}, TContext>;
export declare const getRateMessageUrl: (id: number) => string;
/**
 * @summary Set or clear a reaction on a message
 */
export declare const rateMessage: (id: number, messageReaction: MessageReaction, options?: RequestInit) => Promise<Message>;
export declare const getRateMessageMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rateMessage>>, TError, {
        id: number;
        data: BodyType<MessageReaction>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof rateMessage>>, TError, {
    id: number;
    data: BodyType<MessageReaction>;
}, TContext>;
export type RateMessageMutationResult = NonNullable<Awaited<ReturnType<typeof rateMessage>>>;
export type RateMessageMutationBody = BodyType<MessageReaction>;
export type RateMessageMutationError = ErrorType<void>;
/**
* @summary Set or clear a reaction on a message
*/
export declare const useRateMessage: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof rateMessage>>, TError, {
        id: number;
        data: BodyType<MessageReaction>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof rateMessage>>, TError, {
    id: number;
    data: BodyType<MessageReaction>;
}, TContext>;
export declare const getGetModeStatsUrl: () => string;
/**
 * @summary Get conversation count per mode
 */
export declare const getModeStats: (options?: RequestInit) => Promise<ModeStat[]>;
export declare const getGetModeStatsQueryKey: () => readonly ["/api/stats/modes"];
export declare const getGetModeStatsQueryOptions: <TData = Awaited<ReturnType<typeof getModeStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModeStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getModeStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetModeStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getModeStats>>>;
export type GetModeStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get conversation count per mode
 */
export declare function useGetModeStats<TData = Awaited<ReturnType<typeof getModeStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getModeStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map