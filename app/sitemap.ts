import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
	const base = 'https://bitcoin-price-converter.com';
	return [
		{
			url: `${base}/`,
			lastModified: new Date(),
			changeFrequency: 'hourly',
			priority: 1,
		},
	];
}
