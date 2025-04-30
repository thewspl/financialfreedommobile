import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { scale, verticalScale } from '@/utils/styling'
import ScreenWrapper from '@/components/ScreenWrapper'
import ModalWrapper from '@/components/ModalWrapper'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import { Image } from 'expo-image'
import { getProfileImage } from '@/services/imageService'
import * as Icons from 'phosphor-react-native'
import Typo from '@/components/Typo'
import Input from '@/components/Input'
import { TransactionType, UserDataType, WalletType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { updateUser } from '@/services/userService'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload'
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService'
import { Dropdown } from 'react-native-element-dropdown';
import { expenseCategories, transactionTypes } from '@/constants/data'
import useFetchData from '@/hooks/useFetchData'
import { orderBy, where } from 'firebase/firestore'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { createOrUpdateTransaction, deleteTransaction } from '@/services/transactionService'



const TransactionModal = () => {

    const { user } = useAuth();

    const [transaction, setTransaction] = useState<TransactionType>({
        type: "expense",
        amount: 0,
        description: "",
        category: "",
        date: new Date(),
        walletId: "",
        image: null,
    })

    const [loading, setLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const router = useRouter();

    const {
        data: wallets,
        error: walletError,
        loading: walletLoading,
    } = useFetchData<WalletType>("wallets", [
        where("uid", "==", user?.uid),
        orderBy("created", "desc"),
    ])

    type paramType = {
        id: string;
        type: string;
        amount: string;
        category?: string;
        date: string;
        description?: string;
        image?: string;
        uid?: string;
        walletId: string;
    }

    const oldTransaction: paramType = useLocalSearchParams();

    const onDateChange = (event: any, selectedDate: any) => {
        const currentDate = selectedDate || transaction.date;
        setTransaction({ ...transaction, date: currentDate });
        setShowDatePicker(Platform.OS == "ios" ? true : false);
    };

    useEffect(() => {
        if (oldTransaction?.id) {
            setTransaction({
                type: oldTransaction?.type,
                amount: Number(oldTransaction?.amount),
                description: oldTransaction.description || "",
                category: oldTransaction.category || "",
                date: new Date(oldTransaction.date),
                walletId: oldTransaction.walletId,
                image: oldTransaction?.image,

            })
        }
    }, [])

    const onSubmit = async () => {
        const {
            type,
            amount,
            description,
            category,
            date,
            walletId,
            image } = transaction;

        if (!walletId || !date || !amount || (type == "expense" && !category)) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.")
            return;
        }

        let transactionData: TransactionType = {
            type,
            amount,
            description,
            category,
            date,
            walletId,
            image: image ? image : null,
            uid: user?.uid,
        }


        if (oldTransaction?.id) transactionData.id = oldTransaction.id;
        setLoading(true);
        const res = await createOrUpdateTransaction(transactionData);

        setLoading(false);
        if (res.success) {
            router.back();
        } else {
            Alert.alert("Hata", res.msg);
        }
    }

    const onDelete = async () => {
        if (!oldTransaction?.id) return;
        setLoading(true);
        const res = await deleteTransaction(oldTransaction.id, oldTransaction.walletId);
        setLoading(false);
        if (res.success) {
            router.back();
        } else {
            Alert.alert("Hata", res.msg)
        }
    }

    const showDeleteAlert = () => {
        Alert.alert(
            "Sil",
            "Bu işlemi silmek istediğinize emin misiniz?",
            [
                {
                    text: "İptal",
                    onPress: () => console.log("Silme iptal edildi"),
                    style: "cancel",
                },
                {
                    text: "Sil",
                    onPress: () => onDelete(),
                    style: "destructive",
                }
            ]
        )
    }


    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header
                    title={oldTransaction?.id ? "İşlemi Güncelle" : "Yeni İşlem"}
                    leftIcon={<BackButton />}
                    style={{ marginBottom: spacingY._10 }}
                />

                {/* form */}
                <ScrollView
                    contentContainerStyle={styles.form}
                    showsVerticalScrollIndicator={false}
                >
                    {/* type of transaction */}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>İşlem Tipi</Typo>
                        <Dropdown
                            style={styles.dropdownContainer}
                            activeColor={colors.neutral700}
                            // placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            data={transactionTypes}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            // placeholder={!isFocus ? 'İşlem Seçin' : '...'}
                            value={transaction.type}
                            onChange={item => {
                                setTransaction({ ...transaction, type: item.value })
                            }}
                        />
                    </View>

                    {/* income categories */}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Cüzdan</Typo>
                        <Dropdown
                            style={styles.dropdownContainer}
                            activeColor={colors.neutral700}
                            placeholderStyle={styles.dropdownPlaceholder}
                            selectedTextStyle={styles.dropdownSelectedText}
                            iconStyle={styles.dropdownIcon}
                            data={wallets.map(wallet => ({
                                label: `${wallet?.name} (${wallet?.amount}₺)`,
                                value: wallet?.id,
                            }))}
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            itemTextStyle={styles.dropdownItemText}
                            itemContainerStyle={styles.dropdownItemContainer}
                            containerStyle={styles.dropdownListContainer}
                            placeholder={"Cüzdan Seçin"}
                            value={transaction.walletId}
                            onChange={item => {
                                setTransaction({ ...transaction, walletId: item.value || "" })
                            }}
                        />
                    </View>

                    {/* expense categories */}
                    {
                        transaction.type == "expense" && (
                            <View style={styles.inputContainer}>
                                <Typo color={colors.neutral200} size={16}>Gider Kategorisi</Typo>
                                <Dropdown
                                    style={styles.dropdownContainer}
                                    activeColor={colors.neutral700}
                                    placeholderStyle={styles.dropdownPlaceholder}
                                    selectedTextStyle={styles.dropdownSelectedText}
                                    iconStyle={styles.dropdownIcon}
                                    data={Object.values(expenseCategories)}
                                    maxHeight={300}
                                    labelField="label"
                                    valueField="value"
                                    itemTextStyle={styles.dropdownItemText}
                                    itemContainerStyle={styles.dropdownItemContainer}
                                    containerStyle={styles.dropdownListContainer}
                                    placeholder={"Gider Seçin"}
                                    value={transaction.category}
                                    onChange={item => {
                                        setTransaction({
                                            ...transaction,
                                            category: item.value || ""
                                        })
                                    }}
                                />
                            </View>
                        )}

                    {/* date picker */}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Tarih</Typo>
                        {
                            !showDatePicker && (
                                <Pressable
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Typo size={14}>
                                        {(transaction.date as Date).toLocaleDateString("tr-TR")}
                                    </Typo>
                                </Pressable>
                            )}

                        {
                            showDatePicker && (
                                <View style={Platform.OS == "ios" && styles.iosDatePicker}>
                                    <DateTimePicker
                                        themeVariant="dark"
                                        value={transaction.date as Date}
                                        textColor={colors.white}
                                        mode="date"
                                        display={Platform.OS == "ios" ? "spinner" : "default"}
                                        onChange={onDateChange}
                                    />

                                    {
                                        Platform.OS == "ios" && (
                                            <TouchableOpacity
                                                style={styles.datePickerButton}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Typo size={15} fontWeight={"500"}>
                                                    Onayla
                                                </Typo>
                                            </TouchableOpacity>
                                        )
                                    }
                                </View>
                            )
                        }
                    </View>

                    {/* amount */}
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200} size={16}>Miktar</Typo>
                        <Input
                            // placeholder='örn. Ekstra Gelir'
                            keyboardType="numeric"
                            value={transaction.amount?.toString()}
                            onChangeText={value => setTransaction({
                                ...transaction,
                                amount: Number(value.replace(/[^0-9]/g, ""))
                            })}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo color={colors.neutral200} size={16}>Açıklama</Typo>
                            <Typo color={colors.neutral500} size={14}>(isteğe bağlı)</Typo>
                        </View>
                        <Input
                            // placeholder='örn. Ekstra Gelir'
                            value={transaction.description}
                            multiline
                            containerStyle={{
                                flexDirection: "row",
                                height: verticalScale(100),
                                alignItems: "flex-start",
                                paddingVertical: 15,
                            }}
                            onChangeText={value => setTransaction({
                                ...transaction,
                                description: value,
                            })}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.flexRow}>
                            <Typo color={colors.neutral200} size={16}>Makbuz</Typo>
                            <Typo color={colors.neutral500} size={14}>(isteğe bağlı)</Typo>
                        </View>
                        <ImageUpload
                            file={transaction.image}
                            onClear={() => setTransaction({ ...transaction, image: null })}
                            onSelect={file => setTransaction({ ...transaction, image: file })}
                            placeholder='Resim Yükle'
                        />
                    </View>
                </ScrollView>
            </View>
            <View style={styles.footer}>
                {
                    oldTransaction?.id && !loading && (
                        <Button
                            onPress={showDeleteAlert}
                            style={{
                                backgroundColor: colors.rose,
                                paddingHorizontal: spacingX._15,
                            }}
                        >
                            <Icons.Trash
                                color={colors.white}
                                size={verticalScale(24)}
                                weight="bold"
                            />
                        </Button>
                    )
                }
                <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
                    <Typo color={colors.black} fontWeight={"700"}>
                        {
                            oldTransaction?.id ? "İşlemi Güncelle" : "İşlemi Ekle"
                        }
                    </Typo>
                </Button>
            </View>
        </ModalWrapper>
    )
}

export default TransactionModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacingY._20,
    },
    form: {
        gap: spacingY._20,
        paddingVertical: spacingY._15,
        paddingBottom: spacingY._40,
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._5,
        borderTopWidth: 1,
    },
    inputContainer: {
        gap: spacingY._10,
    },
    iosDropDown: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        fontSize: verticalScale(14),
        borderWidth: 1,
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    androidDropDown: {
        //flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        fontSize: verticalScale(14),
        color: colors.white,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        // paddingHorizontal: spacingX._15,
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._5,
    },
    dateInput: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.neutral300,
        borderRadius: radius._17,
        borderCurve: "continuous",
        paddingHorizontal: spacingX._15,
    },
    iosDatePicker: {
        // backgroundColor: "red",
    },
    datePickerButton: {
        backgroundColor: colors.neutral700,
        alignSelf: "flex-end",
        padding: spacingY._7,
        marginRight: spacingX._7,
        paddingHorizontal: spacingY._15,
        borderRadius: radius._10,
    },
    dropdownContainer: {
        height: verticalScale(54),
        borderWidth: 1,
        borderColor: colors.neutral300,
        paddingHorizontal: spacingX._15,
        borderRadius: radius._15,
        borderCurve: "continuous"
    },
    dropdownItemText: {
        color: colors.white,
    },
    dropdownSelectedText: {
        color: colors.white,
        fontSize: verticalScale(14),
    },
    dropdownListContainer: {
        backgroundColor: colors.neutral900,
        borderRadius: radius._15,
        borderCurve: "continuous",
        paddingVertical: spacingY._7,
        top: 5,
        borderColor: colors.neutral500,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 5,
    },
    dropdownPlaceholder: {
        color: colors.white,
    },
    dropdownItemContainer: {
        borderRadius: radius._15,
        marginHorizontal: spacingX._7,
    },
    dropdownIcon: {
        height: verticalScale(30),
        tintColor: colors.neutral300,
    },
})