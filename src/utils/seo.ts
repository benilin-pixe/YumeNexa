export function updatePageSEO(title: string, description?: string, image?: string) {
  const fullTitle = `${title} — YumeNexa`;
  document.title = fullTitle;

  const metaDesc = description || 'Enter the next anime universe — Discover trending anime, release schedules, news, trailers, streaming, and personal watchlists.';

  let descTag = document.querySelector('meta[name="description"]');
  if (!descTag) {
    descTag = document.createElement('meta');
    descTag.setAttribute('name', 'description');
    document.head.appendChild(descTag);
  }
  descTag.setAttribute('content', metaDesc);

  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', fullTitle);

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', metaDesc);

  if (image) {
    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', image);
  }
}
