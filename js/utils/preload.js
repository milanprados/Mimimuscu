/** Précharge uniquement les images utiles au prochain exercice. */
const seen = new Set();

export function preloadImages(urls = []) {
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
  }
}

export function preloadExercise(exercise) {
  if (exercise?.images) preloadImages(exercise.images);
}
