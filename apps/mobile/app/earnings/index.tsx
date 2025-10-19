import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
  DollarCircle,
  ArrowUp,
  ArrowDown,
  Clock,
  Wallet,
  Calendar,
  MoneyRecive,
} from "iconsax-react-native";
import { useQueryClient } from "@tanstack/react-query";

import { Button, Text } from "@/components/atoms";
import { ScreenTemplate } from "@/components/templates";
import { EmptyState } from "@/components/molecules";
import { ms, mvs } from "@/utils/scaling";
import {
  useAccountsAppControllerGetMyAccounts,
  useAccountsAppControllerGetMyTransactionHistory,
  useAccountsAppControllerRequestPayout,
  getAccountsAppControllerGetMyAccountsQueryKey,
  getAccountsAppControllerGetMyTransactionHistoryQueryKey,
} from "@/api/queries/protected/accounts/accounts";
import type { TransactionDataDto } from "@/api/models/protected";

/**
 * Earnings Screen
 *
 * Shows host earnings summary and transaction history with:
 * - Total, available, pending, and escrowed balances
 * - Transaction history with filters
 * - Request payout functionality
 */
export default function EarningsScreen() {
  const { theme } = useUnistyles();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch account summary
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    error: accountsError,
    refetch: refetchAccounts,
  } = useAccountsAppControllerGetMyAccounts();

  // Fetch transaction history
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useAccountsAppControllerGetMyTransactionHistory({
    page: 1,
    limit: 20,
  });

  // Request payout mutation
  const { mutateAsync: requestPayout, isPending: isRequestingPayout } =
    useAccountsAppControllerRequestPayout({
      mutation: {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAccountsAppControllerGetMyAccountsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getAccountsAppControllerGetMyTransactionHistoryQueryKey(),
          });
        },
      },
    });

  const accountSummary = accountsData?.data;
  const transactions = transactionsData?.data?.items || [];

  const isLoading = isLoadingAccounts || isLoadingTransactions;
  const error = accountsError || transactionsError;

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchTransactions()]);
    setRefreshing(false);
  };

  const handleRequestPayout = () => {
    const availableAmount = (accountSummary?.availableBalance || 0) / 100;

    if (availableAmount < 10) {
      Alert.alert("Minimum Amount", "Minimum payout amount is $10.00");
      return;
    }

    Alert.alert(
      "Request Payout",
      `Request payout of $${availableAmount.toFixed(2)}?\n\nThis amount will be transferred to your registered payout method.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request",
          onPress: async () => {
            try {
              await requestPayout({
                data: {
                  amount: accountSummary!.availableBalance,
                },
              });
              Alert.alert("Success", "Payout request submitted successfully");
            } catch (error: any) {
              Alert.alert("Error", error?.response?.data?.message || "Failed to request payout");
            }
          },
        },
      ]
    );
  };

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "failed") {
      return <Clock size={ms(20)} color={theme.colors.error} variant="Bold" />;
    }

    switch (type) {
      case "credit":
      case "booking_payment":
        return <ArrowDown size={ms(20)} color={theme.colors.success} variant="Bold" />;
      case "debit":
      case "payout":
        return <ArrowUp size={ms(20)} color={theme.colors.error} variant="Bold" />;
      case "escrow_hold":
      case "escrow_release":
        return <Wallet size={ms(20)} color={theme.colors.warning} variant="Bold" />;
      default:
        return <DollarCircle size={ms(20)} color={theme.colors.neutral600} variant="Bold" />;
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === "failed") return theme.colors.error;

    switch (type) {
      case "credit":
      case "booking_payment":
        return theme.colors.success;
      case "debit":
      case "payout":
        return theme.colors.error;
      default:
        return theme.colors.neutral600;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <ScreenTemplate title="Earnings" onBackPress={() => router.back()}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyMediumRegular" color="neutral600" style={styles.loadingText}>
            Loading earnings...
          </Text>
        </View>
      </ScreenTemplate>
    );
  }

  if (error) {
    return (
      <ScreenTemplate title="Earnings" onBackPress={() => router.back()}>
        <View style={styles.errorContainer}>
          <Text variant="bodyMediumRegular" color="error" style={styles.errorText}>
            Failed to load earnings
          </Text>
          <Button variant="outlined" onPress={handleRefresh}>
            Try Again
          </Button>
        </View>
      </ScreenTemplate>
    );
  }

  return (
    <ScreenTemplate title="Earnings" onBackPress={() => router.back()}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: mvs(40) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Balance Summary Cards */}
        <View style={styles.summaryContainer}>
          {/* Total Earnings Card */}
          <View style={styles.earningsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
                <DollarCircle size={ms(24)} color={theme.colors.primary} variant="Bold" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text variant="bodySmallRegular" color="neutral600">
                  Total Earnings
                </Text>
                <Text variant="h4SemiBold" color="neutral900">
                  ${((accountSummary?.totalBalance || 0) / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Balance Breakdown Row */}
          <View style={styles.balanceRow}>
            <View style={[styles.balanceCard, { backgroundColor: `${theme.colors.success}08` }]}>
              <View style={styles.balanceCardContent}>
                <Wallet size={ms(20)} color={theme.colors.success} variant="Bold" />
                <Text variant="bodySmallRegular" color="neutral600" style={styles.balanceLabel}>
                  Available
                </Text>
                <Text variant="bodyLargeSemiBold" color="success">
                  ${((accountSummary?.availableBalance || 0) / 100).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: `${theme.colors.warning}08` }]}>
              <View style={styles.balanceCardContent}>
                <Clock size={ms(20)} color={theme.colors.warning} variant="Bold" />
                <Text variant="bodySmallRegular" color="neutral600" style={styles.balanceLabel}>
                  Pending
                </Text>
                <Text variant="bodyLargeSemiBold" color="warning">
                  ${((accountSummary?.pendingBalance || 0) / 100).toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.balanceCard, { backgroundColor: `${theme.colors.info}08` }]}>
              <View style={styles.balanceCardContent}>
                <MoneyRecive size={ms(20)} color={theme.colors.info} variant="Bold" />
                <Text variant="bodySmallRegular" color="neutral600" style={styles.balanceLabel}>
                  In Escrow
                </Text>
                <Text variant="bodyLargeSemiBold" color="info">
                  ${((accountSummary?.escrowedBalance || 0) / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Request Payout Button */}
          {(accountSummary?.availableBalance || 0) >= 1000 && (
            <Button
              variant="filled"
              onPress={handleRequestPayout}
              disabled={isRequestingPayout}
              style={styles.payoutButton}
            >
              <View style={styles.buttonContent}>
                <MoneyRecive size={ms(20)} color={theme.colors.neutral0} variant="Bold" />
                <Text variant="bodyMediumSemiBold" color="neutral0">
                  Request Payout
                </Text>
              </View>
            </Button>
          )}
        </View>

        {/* Transaction History */}
        {transactions.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <EmptyState
              icon={<Calendar size={ms(64)} variant="Bulk" color={theme.colors.primary} />}
              title="No transactions yet"
              description="Your earnings transactions will appear here"
            />
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {transactions.map((transaction: TransactionDataDto) => {
              const isCredit =
                transaction.type === "credit" || transaction.type === "booking_payment";
              const amount = transaction.amount.amount / 100;
              const color = getTransactionColor(transaction.type, transaction.status);

              return (
                <TouchableOpacity
                  key={transaction._id}
                  style={styles.transactionCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.transactionIcon, { backgroundColor: `${color}15` }]}>
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text variant="bodyLargeSemiBold" color="neutral900" numberOfLines={1}>
                          {transaction.narrative || transaction.description}
                        </Text>
                        <View style={styles.infoRow}>
                          <Calendar size={ms(16)} color={theme.colors.neutral600} variant="Outline" />
                          <Text variant="bodySmallRegular" color="neutral600">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </Text>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  transaction.status === "completed"
                                    ? theme.colors.success
                                    : transaction.status === "pending"
                                      ? theme.colors.warning
                                      : theme.colors.error,
                              },
                            ]}
                          >
                            <Text variant="bodyXSmallSemiBold" color="neutral0">
                              {getStatusLabel(transaction.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text variant="h6SemiBold" style={{ color }}>
                        {isCredit ? "+" : "-"}${amount.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
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
  summaryContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.base,
  },
  earningsCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.base,
  },
  iconContainer: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderText: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  balanceRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  balanceCard: {
    flex: 1,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.md,
  },
  balanceCardContent: {
    alignItems: "center",
    gap: theme.spacing.xxs,
  },
  balanceLabel: {
    marginTop: theme.spacing.xxs,
  },
  payoutButton: {
    marginTop: theme.spacing.xs,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: mvs(60),
  },
  transactionsContainer: {
    padding: theme.spacing.lg,
    paddingTop: 0,
    gap: theme.spacing.lg,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionContent: {
    padding: theme.spacing.base,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.base,
  },
  transactionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.base,
  },
  transactionIcon: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    justifyContent: "center",
    alignItems: "center",
  },
  transactionInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.full,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
}));
