import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { colors, spacingX, spacingY } from '@/constants/theme'
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
import { UserDataType, WalletType } from '@/types'
import Button from '@/components/Button'
import { useAuth } from '@/contexts/authContext'
import { updateUser } from '@/services/userService'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload'
import { createOrUpdateWallet, deleteWallet } from '@/services/walletService'

const WalletModal = () => {

    const { user, updateUserData } = useAuth();

    const [wallet, setWallet] = useState<WalletType>({
        name: "",
        image: null,
    })

    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const oldWallet: { name: string, image: string, id: string } = useLocalSearchParams();

    useEffect(() => {
        if (oldWallet?.id) {
            setWallet({
                name: oldWallet.name,
                image: oldWallet.image,

            })
        }
    }, [])

    const onSubmit = async () => {
        let { name, image } = wallet;
        if (!name.trim() || !image) {
            Alert.alert("Hata", "Lütfen tüm alanları doldurunuz.");
            return;
        }

        const data: WalletType = {
            name,
            image,
            uid: user?.uid,
        };
        if (oldWallet?.id) data.id = oldWallet.id;
        setLoading(true);
        const res = await createOrUpdateWallet(data);
        setLoading(false);
        // console.log("result", res);
        if (res.success) {
            router.back();
        } else {
            Alert.alert("Hata", res.msg)
        }
    }

    const onDelete = async () => {
        if (!oldWallet?.id) return;
        setLoading(true);
        const res = await deleteWallet(oldWallet.id);
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
            "Bu cüzdanı silmek istediğinize emin misiniz? \nBu işlemi yaptığınızda bu cüzdanla ilişkili tüm işlemler silinir.",
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
                    title={oldWallet?.id ? "Cüzdanı Güncelle" : "Yeni Cüzdan"}
                    leftIcon={<BackButton />}
                    style={{ marginBottom: spacingY._10 }}
                />

                {/* form */}
                <ScrollView contentContainerStyle={styles.form}>
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Cüzdan Adı</Typo>
                        <Input
                            placeholder='örn. Ekstra Gelir'
                            value={wallet.name}
                            onChangeText={value => setWallet({ ...wallet, name: value })}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Cüzdan Resmi</Typo>
                        <ImageUpload
                            file={wallet.image}
                            onClear={() => setWallet({ ...wallet, image: null })}
                            onSelect={file => setWallet({ ...wallet, image: file })}
                            placeholder='Resim Yükle'
                        />
                    </View>
                </ScrollView>
            </View>
            <View style={styles.footer}>
                {
                    oldWallet?.id && !loading && (
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
                            oldWallet?.id ? "Cüzdanı Güncelle" : "Cüzdanı Ekle"
                        }
                    </Typo>
                </Button>
            </View>
        </ModalWrapper>
    )
}

export default WalletModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: spacingY._20,
        //paddingVertical: spacingY._30,
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
    form: {
        gap: spacingY._30,
        marginTop: spacingY._15,
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center",
    },
    avatar: {
        alignSelf: "center",
        backgroundColor: colors.neutral300,
        height: verticalScale(135),
        width: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        borderColor: colors.neutral500,
        //overflow: "hidden",
        //position: "relative",
    },
    editIcon: {
        position: "absolute",
        bottom: spacingY._5,
        right: spacingY._7,
        borderRadius: 100,
        backgroundColor: colors.neutral100,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        padding: spacingY._7,
    },
    inputContainer: {
        gap: spacingY._10,
    },
})