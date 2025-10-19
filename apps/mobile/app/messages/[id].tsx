import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Send, User } from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { ms, mvs } from "@/utils/scaling";
import {
  useMessagingAppControllerGetMessages,
  useMessagingAppControllerGetConversation,
  useMessagingAppControllerSendMessage,
  useMessagingAppControllerMarkAsRead,
  getMessagingAppControllerGetMessagesQueryKey,
  getMessagingAppControllerGetConversationsQueryKey,
} from "@/api/queries/protected/messaging/messaging";
import type { MessageDataDto } from "@/api/models/protected";

/**
 * Chat Screen - Individual Conversation
 *
 * Displays messages in a conversation and allows sending new messages
 */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState("");

  // Fetch conversation details
  const { data: conversationData } = useMessagingAppControllerGetConversation(id!);

  // Fetch messages
  const {
    data: messagesData,
    isLoading,
    error,
    refetch,
  } = useMessagingAppControllerGetMessages(id!, {
    page: 1,
    limit: 50,
  });

  // Mark as read mutation
  const { mutateAsync: markAsRead } = useMessagingAppControllerMarkAsRead();

  // Send message mutation
  const { mutateAsync: sendMessage, isPending: isSending } = useMessagingAppControllerSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getMessagingAppControllerGetMessagesQueryKey(id!),
        });
        queryClient.invalidateQueries({
          queryKey: getMessagingAppControllerGetConversationsQueryKey(),
        });
        setMessageText("");
        // Scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    },
  });

  const messages = messagesData?.data?.messages || [];
  const conversation = conversationData?.data;

  // Mark conversation as read when opened
  useEffect(() => {
    if (id && conversation?.unread_count && conversation.unread_count > 0) {
      markAsRead({ id });
    }
  }, [id, conversation?.unread_count]);

  // Auto-scroll to bottom on load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || isSending) return;

    try {
      await sendMessage({
        id: id!,
        data: {
          content: messageText.trim(),
          message_type: "text",
          attachments: [],
        },
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isMyMessage = (message: MessageDataDto) => {
    // TODO: Compare with current user ID
    // For now, check if sender is in the participants list as "host"
    return message.sender.role === "host";
  };

  if (isLoading) {
    return (
      <ScreenTemplate title="Chat" onBackPress={() => router.back()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading messages...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (error) {
    return (
      <ScreenTemplate title="Chat" onBackPress={() => router.back()}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load messages
          </Text>
          <Button variant="outlined" onPress={() => refetch()}>
            Try Again
          </Button>
        </View>
      </ScreenTemplate>
    );
  }

  const otherParticipant = conversation?.participants[0];

  return (
    <ScreenTemplate title={conversation?.title || "Chat"} onBackPress={() => router.back()}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.container}>
          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyMessagesContainer}>
                <User size={ms(48)} color={theme.colors.neutral400} variant="Bulk" />
                <Text variant="bodyMediumRegular" color="neutral600" style={styles.emptyText}>
                  No messages yet
                </Text>
                <Text variant="bodySmallRegular" color="neutral500" style={styles.emptySubtext}>
                  Start the conversation with {otherParticipant?.name || "the other party"}
                </Text>
              </View>
            ) : (
              messages.map((message: MessageDataDto) => {
                const isMine = isMyMessage(message);

                return (
                  <View
                    key={message.id}
                    style={[styles.messageRow, isMine && styles.messageRowRight]}
                  >
                    <View style={[styles.messageBubble, isMine && styles.messageBubbleOwn]}>
                      <Text
                        variant="bodyMediumRegular"
                        color={isMine ? "neutral0" : "neutral900"}
                        style={styles.messageText}
                      >
                        {message.content}
                      </Text>
                      <Text
                        variant="bodyXSmallRegular"
                        color={isMine ? "neutral0" : "neutral600"}
                        style={styles.messageTime}
                      >
                        {formatMessageTime(message.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.neutral500}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      messageText.trim() && !isSending
                        ? theme.colors.primary
                        : theme.colors.neutral300,
                  },
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={theme.colors.neutral0} />
                ) : (
                  <Send size={ms(20)} color={theme.colors.neutral0} variant="Bold" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  errorText: {
    marginBottom: theme.spacing.md,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  emptyText: {
    marginTop: theme.spacing.base,
  },
  emptySubtext: {
    textAlign: "center",
    maxWidth: "80%",
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    maxWidth: "75%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
    gap: theme.spacing.xxs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleOwn: {
    backgroundColor: theme.colors.primary,
  },
  messageText: {
    lineHeight: mvs(20),
  },
  messageTime: {
    alignSelf: "flex-end",
    opacity: 0.8,
  },
  inputContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    fontSize: ms(15),
    color: theme.colors.neutral900,
    maxHeight: mvs(100),
  },
  sendButton: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    justifyContent: "center",
    alignItems: "center",
  },
}));
