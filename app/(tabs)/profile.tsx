import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Header from '@/components/Header'
import BackButton from '@/components/BackButton'
import Typo from '@/components/Typo'
import { useAuth } from '@/contexts/authContext'
import { Image } from 'expo-image';
import { getProfileImage } from '@/services/imageService'
import { accountOptionType } from '@/types'
import * as Icons from 'phosphor-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated'
import { signOut } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useRouter } from 'expo-router'

const Profile = () => {
    const { user } = useAuth();
    const router = useRouter();

    const accountOptions: accountOptionType[] = [
        {
            title: "Profili Düzenle",
            icon: (<Icons.User size={26} color={colors.white} weight='fill' />),
            routeName: '/(modals)/profileModal',
            bgColor: "#6366f1",
        },
        {
            title: "Ayarlar",
            icon: (<Icons.GearSix size={26} color={colors.white} weight='fill' />),
            //routeName: '/(modals)/profileModal',
            bgColor: "#059669",
        },
        {
            title: "Gizlilik Politikası",
            icon: (<Icons.Lock size={26} color={colors.white} weight='fill' />),
            //routeName: '/(modals)/profileModal',
            bgColor: colors.neutral600,
        },
        {
            title: "Çıkış Yap",
            icon: (<Icons.Power size={26} color={colors.white} weight='fill' />),
            //routeName: '/(modals)/profileModal',
            bgColor: "#e11d48",
        },
    ]

    const handleLogout = async () => {
        await signOut(auth);
    }

    const showLogoutAlert = () => {
        Alert.alert("Çıkış", "Çıkış yapmak istediğinize emin misiniz?", [
            {
                text: "Hayır",
                onPress: () => console.log("Çıkış iptal"),
                style: 'cancel'
            },
            {
                text: "Evet",
                onPress: () => handleLogout(),
                style: 'destructive'
            }
        ])
    }

    const handlePress = (item: accountOptionType) => {
        if (item.title === "Çıkış Yap") {
            showLogoutAlert();
        }

        if (item.routeName) router.push(item.routeName);
    }

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Header title="Hesap" style={{ marginVertical: spacingY._10 }} />

                {/* User Info */}
                <View style={styles.userInfo}>
                    {/* avatar */}
                    <View>
                        {/* user image */}
                        <Image
                            source={getProfileImage(user?.image)}
                            style={styles.avatar}
                            contentFit='cover'
                            transition={100}
                        />
                    </View>
                    {/*name & email */}
                    <View style={styles.nameContainer}>
                        <Typo size={24} fontWeight={"600"} color={colors.neutral100}>
                            {user?.name}
                        </Typo>
                        <Typo size={15} color={colors.neutral400}>
                            {user?.email}
                        </Typo>
                    </View>
                </View>

                {/* account options */}
                <View style={styles.accountOptions}>
                    {
                        accountOptions.map((item, index) => {
                            return (
                                <Animated.View
                                    key={index.toString()}
                                    entering={FadeInDown.delay(index * 50)
                                        .springify()
                                        .damping(14)}
                                    style={styles.listItem}>
                                    <TouchableOpacity style={styles.flexRow} onPress={() => handlePress(item)}>
                                        {/* icon */}
                                        <View style={[
                                            styles.listIcon,
                                            { backgroundColor: item?.bgColor },
                                        ]}>
                                            {item.icon && item.icon}
                                        </View>
                                        <Typo size={16} style={{ flex: 1 }} fontWeight={'500'}>
                                            {item.title}
                                        </Typo>
                                        <Icons.CaretRight
                                            size={verticalScale(20)}
                                            weight='bold'
                                            color={colors.white}
                                        />
                                    </TouchableOpacity>
                                </Animated.View>
                            )
                        })
                    }
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default Profile

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacingX._20,
    },
    userInfo: {
        marginTop: verticalScale(30),
        alignItems: "center",
        gap: spacingY._15,
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
        // overflow: "hidden",
        // position: "relative",
    },
    editIcon: {
        position: "absolute",
        bottom: 5,
        right: 8,
        borderRadius: 50,
        backgroundColor: colors.neutral100,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
        padding: 5,
    },
    nameContainer: {
        gap: verticalScale(4),
        alignItems: "center",
    },
    listIcon: {
        height: verticalScale(44),
        width: verticalScale(44),
        backgroundColor: colors.neutral500,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius._15,
        borderCurve: "continuous",
    },
    listItem: {
        marginBottom: verticalScale(17),
    },
    accountOptions: {
        marginTop: spacingY._35,
    },
    flexRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacingX._10,
    },
});