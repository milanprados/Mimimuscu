
const seen=new Set();
export function preloadImages(urls=[]){
  for(const url of urls){
    if(!url || seen.has(url))continue;
    seen.add(url);
    const img=new Image();
    img.decoding="async";
    img.src=url;
  }
}
export function preloadExercise(ex){
  if(ex?.images)preloadImages(ex.images);
}
