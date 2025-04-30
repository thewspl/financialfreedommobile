import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, deleteDoc, doc, getDoc, query, setDoc, Timestamp, where, updateDoc, orderBy, getDocs } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";
import { getLast7Days } from "@/utils/common";
import { scale } from "@/utils/styling";
import { colors } from "@/constants/theme";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
    try {
        const { id, type, walletId, amount, image } = transactionData;
        if (!amount || amount <= 0 || !walletId || !type) {
            return { success: false, msg: "Lütfen gerekli alanları doldurunuz." };
        }

        if (id) {
            const oldTransactionSnapshot = await getDoc(doc(firestore, "transactions", id));
            const oldTransaction = oldTransactionSnapshot.data() as TransactionType;
            const shouldRevertOriginal = oldTransaction.type != type || oldTransaction.amount != amount || oldTransaction.walletId != walletId;
            if (shouldRevertOriginal) {
                let res = await revertAndUpdateWallets(oldTransaction, Number(amount), type, walletId);
                if (!res.success) return res;
            }

        } else {
            // update wallet for new transaction
            let res = await updateWalletForNewTransaction(
                walletId!,
                Number(amount!),
                type,
            )
            if (!res.success) return res;
        }

        if (image) {
            const imageUploadRes = await uploadFileToCloudinary(image, "transactions");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg || "Makbuz yüklenemedi" }
            }
            transactionData.image = imageUploadRes.data;
        }

        const transactionRef = id
            ? doc(firestore, "transactions", id)
            : doc(collection(firestore, "transactions"));

        await setDoc(transactionRef, transactionData, { merge: true });

        return {
            success: true,
            data: { ...transactionData, id: transactionRef.id }
        };

    } catch (err: any) {
        console.log("İşlem silinirken ya da güncellenirken hata meydana geldi: ", err);
        return { success: false, msg: err.message };
    }
};

const updateWalletForNewTransaction = async (
    walletId: string,
    amount: number,
    type: string,
) => {
    try {

        const walletRef = doc(firestore, "wallets", walletId);
        const walletSnapshot = await getDoc(walletRef);
        if (!walletSnapshot.exists()) {
            console.log("Yeni işlem için cüzdan güncelleme hatası ");
            return { success: false, msg: "Cüzdan bulunamadı" };
        }

        const walletData = walletSnapshot.data() as WalletType;

        if (type == "expense" && walletData.amount! - amount < 0) {
            return {
                success: false,
                msg: "Seçilen cüdan yeterli bakiyeye sahip değil"
            };
        }

        const updateType = type == "income" ? "totalIncome" : "totalExpenses";
        const updatedWalletAmound =
            type == "income"
                ? Number(walletData.amount) + amount
                : Number(walletData.amount) - amount;

        const updatedTotals =
            type == "income"
                ? Number(walletData.totalIncome) + amount
                : Number(walletData.totalExpenses) + amount;

        await updateDoc(walletRef, {
            amount: updatedWalletAmound,
            [updateType]: updatedTotals
        })
        return { success: true };
    } catch (err: any) {
        console.log("Yeni işlem için cüzdan güncelleme hatası ", err);
        return { success: false, msg: err.message };
    }
}

const revertAndUpdateWallets = async (
    oldTransaction: TransactionType,
    newTransactionAmount: number,
    newTransactionType: string,
    newWalletId: string,
) => {
    try {

        const originalWalletSnapshot = await getDoc(
            doc(firestore, "wallets", oldTransaction.walletId));

        const originalWallet = originalWalletSnapshot.data() as WalletType;

        let newWalletSnapshot = await getDoc(
            doc(firestore, "wallets", newWalletId));

        let newWallet = newWalletSnapshot.data() as WalletType;

        const revertType = oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";

        const revertIncomeExpense: number =
            oldTransaction.type == "income"
                ? -Number(oldTransaction.amount)
                : Number(oldTransaction.amount);

        const revertedWalletAmount =
            Number(originalWallet.amount) + revertIncomeExpense;

        const revertedIncomeExpenseAmount =
            Number(originalWallet[revertType]) - Number(oldTransaction.amount);

        if (newTransactionType == "expense") {
            if (
                oldTransaction.walletId == newWalletId &&
                revertedWalletAmount < newTransactionAmount
            ) {
                return {
                    success: false,
                    msg: "Seçili cüzdanın yeterli bütçesi yok."
                }
            }
            if (newWallet.amount! < newTransactionAmount) {
                return {
                    success: false,
                    msg: "Seçili cüzdanın yeterli bütçesi yok."
                }
            }
        }

        await createOrUpdateWallet({
            id: oldTransaction.walletId,
            amount: revertedWalletAmount,
            [revertType]: revertedIncomeExpenseAmount,
        })

        //////////////////////////////////////////////////////////////////////

        newWalletSnapshot = await getDoc(
            doc(firestore, "wallets", newWalletId));

        newWallet = newWalletSnapshot.data() as WalletType;

        const updateType = newTransactionType == "income" ? "totalIncome" : "totalExpenses";

        const updatedTransactionAmount: number =
            newTransactionType == "income"
                ? Number(newTransactionAmount)
                : -Number(newTransactionAmount);

        const newWalletAmount = Number(newWallet.amount) + updatedTransactionAmount;

        const newIncomeExpenseAmount = Number(
            newWallet[updateType]! + Number(newTransactionAmount)
        );

        await createOrUpdateWallet({
            id: newWalletId,
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount,
        })

        return { success: true };
    } catch (err: any) {
        console.log("Yeni işlem için cüzdan güncelleme hatası ", err);
        return { success: false, msg: err.message };
    }
}


export const deleteTransaction = async (
    transactionId: string,
    walletId: string,
) => {
    try {
        const transactionRef = doc(firestore, "transactions", transactionId)
        const transactionSnapshot = await getDoc(transactionRef);

        if (!transactionSnapshot.exists()) {
            return { success: false, msg: "İşlem bulunamadı" };
        }
        const transactionData = transactionSnapshot.data() as TransactionType;

        const transactionType = transactionData?.type;
        const transactionAmount = transactionData?.amount;

        const walletSnapshot = await getDoc(
            doc(firestore, "wallets", walletId));
        const walletData = walletSnapshot.data() as WalletType;

        const updateType = transactionType == "income" ? "totalIncome" : "totalExpenses";

        const newWalletAmount = walletData?.amount! - (transactionType == "income" ? transactionAmount : -transactionAmount);

        const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount;

        if (transactionType == "income" && newWalletAmount < 0) {
            return { success: false, msg: "Bu işlemi silemezsiniz." }
        }

        await createOrUpdateWallet({
            id: walletId,
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount,
        })

        await deleteDoc(transactionRef);

        return { success: true };
    } catch (err: any) {
        console.log("Yeni işlem için cüzdan güncelleme hatası ", err);
        return { success: false, msg: err.message };
    }
}


export const fetchWeeklyStats = async (
    uid: string,
): Promise<ResponseType> => {
    try {
        const db = firestore;
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const transactionsQuery = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
            where("date", "<=", Timestamp.fromDate(today)),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(transactionsQuery);
        const weeklyData = getLast7Days();
        const transactions: TransactionType[] = [];

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType;
            transaction.id = doc.id;
            transactions.push(transaction);

            const transactionDate = (transaction.date as Timestamp)
                .toDate()
                .toISOString()
                .split("T")[0];

            const dayData = weeklyData.find((day) => day.date == transactionDate);

            if (dayData) {
                if (transaction.type == "income") {
                    dayData.income += transaction.amount;
                } else if (transaction.type == "expense") {
                    dayData.expense += transaction.amount;
                }
            }
        })

        const stats = weeklyData.flatMap((day) => [
            {
                value: day.income,
                label: day.day,
                spacing: scale(4),
                labelWidth: scale(30),
                frontColor: colors.primary,
            },
            { value: day.expense, frontColor: colors.rose },
        ]);

        return {
            success: true,
            data: {
                stats,
                transactions,
            }
        }
    } catch (err: any) {
        console.log("Haftalık istatistikler alırken hata ", err);
        return { success: false, msg: err.message };
    }
}