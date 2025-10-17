import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const base = 'https://bitcoin-price-converter.com';
	const locales = ['en','ru','de','fr','es','tr','zh','it','pl','cs','nl','pt','ja'];
	const lastModified = new Date();
	const entries: MetadataRoute.Sitemap = [
		{
			url: `${base}/`,
			lastModified,
			changeFrequency: 'hourly',
			priority: 1,
			alternates: {
				languages: Object.fromEntries(locales.map(l => [l, `${base}/?lang=${l}`])) as any,
			},
		},
	];
	return entries;
}
