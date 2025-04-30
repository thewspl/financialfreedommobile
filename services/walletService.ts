import { ResponseType, WalletType } from "@/types";
import { uploadFileToCloudinary } from "./imageService";
import { collection, deleteDoc, doc, getDocs, getDoc, query, setDoc, where, writeBatch } from "firebase/firestore";
import { firestore } from "@/config/firebase";

export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>,
): Promise<ResponseType> => {
    try {
        let walletToSave = { ...walletData };

        if (walletData.image) {
            const imageUploadRes = await uploadFileToCloudinary(
                walletData.image,
                "wallets"
            );
            if (!imageUploadRes.success) {
                return {
                    success: false,
                    msg: imageUploadRes.msg || "Cüzdan resmi yüklenemedi"
                }
            }
            walletToSave.image = imageUploadRes.data;
        }

        if (!walletData?.id) {
            // yeni cüzdan
            walletToSave.amount = 0;
            walletToSave.totalIncome = 0;
            walletToSave.totalExpenses = 0;
            walletToSave.created = new Date();
        }

        const walletRef = walletData?.id
            ? doc(firestore, "wallets", walletData?.id)
            : doc(collection(firestore, "wallets"));

        await setDoc(walletRef, walletToSave, { merge: true });
        return { success: true, data: { ...walletToSave, id: walletRef.id } };
    } catch (error: any) {
        console.log("Cüzdanı oluşturulurken/güncellenirken hata meydana geldi", error);
        return { success: false, msg: error.message };
    }
}


export const deleteWallet = async (walletId: string): Promise<ResponseType> => {
    try {
        const walletRef = doc(firestore, "wallets", walletId);
        await deleteDoc(walletRef);

        deleteTransactionsByWalletId(walletId);

        return { success: true, msg: "Cüzdan silindi" };
    } catch (err: any) {
        console.log("Cüzdan silinirken hata meydana geldi", err);
        return { success: false, msg: err.message };
    }
}

export const deleteTransactionsByWalletId = async (walletId: string): Promise<ResponseType> => {
    try {
        let hasMoreTransactions = true;

        while (hasMoreTransactions) {
            const transactionsQuery = query(
                collection(firestore, "transactions"),
                where("walletId", "==", walletId)
            );

            const transactionsSnapshot = await getDocs(transactionsQuery)
            if (transactionsSnapshot.size == 0) {
                hasMoreTransactions = false;
                break;
            }

            const batch = writeBatch(firestore);

            transactionsSnapshot.forEach((transactionDoc) => {
                batch.delete(transactionDoc.ref);
            })

            await batch.commit();

            console.log(`${transactionsSnapshot.size} işlem bu cüzdanla birlikte silindi. `)
        }
        return {
            success: true,
            msg: "Tüm işlemler başarıyla silindi."
        }


        return { success: true, msg: "Cüzdan silindi" };
    } catch (err: any) {
        console.log("Cüzdan silinirken hata meydana geldi", err);
        return { success: false, msg: err.message };
    }
}