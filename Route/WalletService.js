const WalletSettings = require("../Models/WalletSettings");
const UserWallet = require("../Models/UserWallet");

const DEFAULT_SETTINGS = {
  earnType: "percentage",
  earnValue: 5,
  coinValue: 1,
  maxRedeemPercent: 50,
  minOrderToEarn: 0,
  minOrderToRedeem: 0,
  active: true,
};

const getWalletSettings = async () => {
  let settings = await WalletSettings.findOne();
  if (!settings) {
    settings = await WalletSettings.create(DEFAULT_SETTINGS);
  }
  return settings;
};

const getOrCreateWallet = async (userId) => {
  let wallet = await UserWallet.findOne({ userId });
  if (!wallet) {
    wallet = await UserWallet.create({ userId, balance: 0, transactions: [] });
  }
  return wallet;
};

const calculateEarnCoins = (settings, orderSubtotal) => {
  if (!settings?.active || orderSubtotal < (settings.minOrderToEarn || 0)) {
    return 0;
  }

  if (settings.earnType === "flat") {
    return Math.floor(settings.earnValue || 0);
  }

  return Math.floor((orderSubtotal * (settings.earnValue || 0)) / 100);
};

const calculateMaxRedeemableCoins = (settings, walletBalance, payableAmount) => {
  if (!settings?.active || payableAmount < (settings.minOrderToRedeem || 0)) {
    return 0;
  }

  const coinValue = settings.coinValue || 1;
  const maxByPercent = Math.floor(
    ((payableAmount * (settings.maxRedeemPercent || 100)) / 100) / coinValue
  );
  const maxByPayable = Math.floor(payableAmount / coinValue);

  return Math.max(0, Math.min(walletBalance, maxByPercent, maxByPayable));
};

const previewWalletApply = async ({ userId, payableAmount, coinsToUse = 0 }) => {
  const settings = await getWalletSettings();
  const wallet = await getOrCreateWallet(userId);
  const maxUsableCoins = calculateMaxRedeemableCoins(settings, wallet.balance, payableAmount);
  const appliedCoins = Math.max(0, Math.min(Math.floor(coinsToUse || 0), maxUsableCoins));
  const walletDiscount = appliedCoins * (settings.coinValue || 1);
  const finalPayable = Math.max(0, payableAmount - walletDiscount);
  const coinsToEarn = calculateEarnCoins(settings, finalPayable);

  return {
    settings,
    walletBalance: wallet.balance,
    maxUsableCoins,
    appliedCoins,
    walletDiscount,
    finalPayable,
    coinsToEarn,
  };
};

const debitWalletForOrder = async ({ userId, orderId, coins, description }) => {
  if (!coins || coins <= 0) return null;

  const wallet = await getOrCreateWallet(userId);
  if (wallet.balance < coins) {
    throw new Error("Insufficient wallet balance");
  }

  wallet.balance -= coins;
  wallet.transactions.push({
    type: "debit",
    coins,
    orderId,
    description: description || "Coins used on order",
  });
  await wallet.save();
  return wallet;
};

const creditWalletForOrder = async ({ userId, orderId, coins, description }) => {
  if (!coins || coins <= 0) return null;

  const wallet = await getOrCreateWallet(userId);
  wallet.balance += coins;
  wallet.transactions.push({
    type: "credit",
    coins,
    orderId,
    description: description || "Coins earned on order",
  });
  await wallet.save();
  return wallet;
};

const processWalletOnOrder = async ({
  userId,
  orderId,
  orderSubtotal,
  walletCoinsUsed = 0,
}) => {
  const settings = await getWalletSettings();

  if (walletCoinsUsed > 0) {
    await debitWalletForOrder({
      userId,
      orderId,
      coins: walletCoinsUsed,
      description: `Used on order ${orderId}`,
    });
  }

  const earnedCoins = calculateEarnCoins(settings, orderSubtotal);
  if (earnedCoins > 0) {
    await creditWalletForOrder({
      userId,
      orderId,
      coins: earnedCoins,
      description: `Earned on order ${orderId}`,
    });
  }

  const wallet = await getOrCreateWallet(userId);
  return { earnedCoins, walletBalance: wallet.balance };
};

module.exports = {
  getWalletSettings,
  getOrCreateWallet,
  calculateEarnCoins,
  calculateMaxRedeemableCoins,
  previewWalletApply,
  debitWalletForOrder,
  creditWalletForOrder,
  processWalletOnOrder,
};
