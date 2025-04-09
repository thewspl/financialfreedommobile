import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
    try {
        const { id, type, walletId, amount, image } = transactionData;
        if (!amount || amount <= 0 || !walletId || !type) {
            return { success: false, msg: "Lütfen gerekli alanları doldurunuz." };
        }

        if (id) {
            // todo: update existing transction
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


//Video 5:21:00