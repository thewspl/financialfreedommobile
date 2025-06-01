import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export interface RssItem {
    title: string;
    description: string;
    link: string;
    guid: string;
    pubDate: string;
    thumbnail?: string;
}

export interface RssFeed {
    title: string;
    description: string;
    link: string;
    items: RssItem[];
    lastBuildDate: string;
}

const axiosInstance = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
    }
});

export async function fetchFinancialTimesRss(): Promise<RssFeed> {
    try {
        const response = await axiosInstance.get('https://www.ft.com/rss/home');

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "_",
            isArray: (name) => name === 'item',
        });

        const result = parser.parse(response.data);

        const channel = result.rss.channel;

        const feed: RssFeed = {
            title: channel.title.replace(/\<!\[CDATA\[|\]\]>/g, ''),
            description: channel.description.replace(/\<!\[CDATA\[|\]\]>/g, ''),
            link: channel.link,
            lastBuildDate: channel.lastBuildDate,
            items: channel.item.map((item: any) => ({
                title: item.title.replace(/\<!\[CDATA\[|\]\]>/g, ''),
                description: item.description ? item.description.replace(/\<!\[CDATA\[|\]\]>/g, '') : '',
                link: item.link,
                guid: item.guid._isPermaLink === 'false' ? item.guid['#text'] : item.guid,
                pubDate: item.pubDate,
                thumbnail: item['media:thumbnail'] ? item['media:thumbnail']._url : undefined,
            })),
        };

        return feed;
    } catch (error) {
        console.error('Error fetching RSS feed:', error);
        throw error;
    }
}

export async function fetchSabahFinanceRss(): Promise<RssFeed> {
    try {
        const response = await axiosInstance.get('https://www.sabah.com.tr/rss/finansborsa-haberleri.xml');

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "_",
            isArray: (name) => name === 'item',
        });

        const result = parser.parse(response.data);

        const channel = result.rss.channel;

        const feed: RssFeed = {
            title: channel.title || 'SABAH Finans Borsa Haberleri',
            description: channel.description || 'Türkiye\'nin en iyi Gazetesi',
            link: channel.link || 'https://www.sabah.com.tr',
            lastBuildDate: channel.lastBuildDate || new Date().toUTCString(),
            items: channel.item.map((item: any) => {
                // Extract image URL from description HTML
                const imgMatch = item.description ? item.description.match(/src="([^"]+)"/) : null;
                const imgUrl = imgMatch ? imgMatch[1] : undefined;

                // Clean up description by removing HTML tags
                let cleanDescription = item.description
                    ? item.description.replace(/<img[^>]*>/g, '')
                        .replace(/<br\s*\/?>/g, ' ')
                        .replace(/<a[^>]*>.*?<\/a>/g, '')
                        .replace(/<[^>]*>/g, '')
                        .trim()
                    : '';

                return {
                    title: item.title.replace(/\<!\[CDATA\[|\]\]>/g, ''),
                    description: cleanDescription,
                    link: item.link,
                    guid: item.guid || item.link,
                    pubDate: item.pubDate,
                    thumbnail: imgUrl,
                };
            }),
        };

        return feed;
    } catch (error) {
        console.error('Error fetching Sabah finance RSS feed:', error);
        throw error;
    }
} 