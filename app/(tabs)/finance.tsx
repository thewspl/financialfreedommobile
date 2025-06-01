import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Text } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors, spacingX, spacingY } from '@/constants/theme';
import Typo from '@/components/Typo';
import { fetchSabahFinanceRss, RssFeed, RssItem } from '@/services/rssService';
import { Image } from 'expo-image';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import ScreenWrapper from '@/components/ScreenWrapper';
import { verticalScale } from '@/utils/styling';

export default function FinanceScreen() {
    const [feed, setFeed] = useState<RssFeed | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadFeed = async () => {
        try {
            setLoading(true);
            const data = await fetchSabahFinanceRss();
            setFeed(data);
        } catch (error) {
            console.error('Failed to load finance news feed:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFeed();
    };

    useEffect(() => {
        loadFeed();
    }, []);

    const handleOpenArticle = (url: string) => {
        Linking.openURL(url);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'd MMM yyyy • HH:mm', { locale: tr });
        } catch (e) {
            return dateString;
        }
    };

    const renderNewsItem = ({ item }: { item: RssItem }) => (
        <TouchableOpacity
            style={styles.newsItem}
            onPress={() => handleOpenArticle(item.link)}
            activeOpacity={0.7}
        >
            {item.thumbnail && (
                <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    transition={300}
                />
            )}
            <View style={styles.itemContent}>
                <Text style={styles.titleText} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.descriptionText} numberOfLines={3}>{item.description}</Text>
                <Typo size={12} fontWeight="400" color={colors.neutral400} style={styles.itemDate}>{formatDate(item.pubDate)}</Typo>
            </View>
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Typo size={24} fontWeight="700">Finans Haberleri</Typo>
                    <Typo size={16} fontWeight="500" color={colors.neutral400} style={{ marginTop: spacingY._5 }}>Sabah Gazetesi</Typo>
                </View>

                {loading && !refreshing ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={feed?.items}
                        keyExtractor={(item) => item.guid || item.link}
                        renderItem={renderNewsItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Typo size={16} fontWeight="500" color={colors.neutral400}>Haber bulunamadı</Typo>
                            </View>
                        }
                    />
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacingX._20,
    },
    header: {
        paddingVertical: spacingY._15,
        marginBottom: spacingY._10,
    },
    listContent: {
        paddingBottom: verticalScale(100),
    },
    newsItem: {
        backgroundColor: colors.neutral800,
        borderRadius: 12,
        marginBottom: spacingY._15,
        overflow: 'hidden',
    },
    thumbnail: {
        height: verticalScale(180),
        width: '100%',
    },
    itemContent: {
        padding: spacingX._15,
    },
    titleText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.white,
        marginBottom: spacingY._7,
    },
    descriptionText: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.neutral300,
        marginBottom: spacingY._7,
    },
    itemDate: {
        marginTop: spacingY._5,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        padding: spacingY._30,
        alignItems: 'center',
    },
}); 